
Eos = require('eosjs')

config = {
    chainId: null,
    keyProvider: [''],
    httpEndpoint: 'https://eos.greymass.com:443',
    expireInSeconds: 60,
    broadcast: true,
    verbose: false, 
    sign: false,
    contractName: "chintailease"
}

eos = Eos(config)

const optionDefinitions = [
    { name: 'cmd', alias: 'c', type: String, defaultOption: true },
    { name: 'account', alias: 'a', type: String },
    { name: 'amount', type: Number },
    { name: 'days', alias: 'd', type: Number },
    { name: 'rate', alias: 'r', type: Number, },
    { name: 'ratio', type: Number,  },
]

const commandLineArgs = require('command-line-args')
const options = commandLineArgs(optionDefinitions)

options.cmd = options.cmd || 'borrow'

const valid =
    options.help ||
    (
        options.cmd === 'borrow' &&
        options.account &&
        options.amount &&
        options.days &&
        options.rate
    ) 
    ||
    (
        options.cmd === 'rate' &&
        options.days
    )


if(!valid) {
    console.log('Bad args')
    return 1
}

function getMemo(account, stake, rate, days, ratio) {
    return `${account}|${account}|1|${stake.toFixed(0)}|${rate.toFixed(4)}|${days}|${ratio.toFixed(4)}|${Math.random().toString(36).substring(2, 12)}`
}

function getRate(days) {
    return eos.getTableRows({
        code: config.contractName,
        scope: 'market',
        table: 'market',
        limit:-1,
        json: true,
    }).then(res=>{
        if (res.rows.length === 0)
            throw "No leases"
        
        let leases = res.rows.filter(l => l.duration === days * 60 * 60 * 24).sort((a,b)=> {
            return parseFloat(a.interest) - parseFloat(b.interest)
        })

        let rate = leases[0].current_price
        leases = leases.filter(l => l.current_price === rate)
        
        let sum = 0.0
        leases.forEach(l => sum += parseFloat(l.sum_quantity_left.slice(0, -4)))

        return {
            rate: parseFloat(rate),
            quantity_left: sum
        }
    }).catch(err=>{
        console.log(err)
    })
}


//console.error(JSON.stringify(trx, null, '  '))

switch (options.cmd) {
    case 'borrow':
        let userAccount = options.account
        let eosQuantity = `${(options.amount * options.rate / 100.0).toFixed(4)} EOS`

        let memo = getMemo(userAccount, options.amount, options.rate / 100.0, options.days, options.ratio || 1.0)
        let trx = {
            actions: [
                {
                    account: config.contractName,
                    name: 'prepare',
                    authorization: [{
                        actor: userAccount,
                        permission: 'active'
                    }],
                    data: {
                        memo: memo
                    }
                },
                {
                    account: 'eosio.token',
                    name: 'transfer',
                    authorization: [{
                        actor: userAccount,
                        permission: 'active'
                    }],
                    data: {
                        from: userAccount,
                        to: config.contractName,
                        quantity: eosQuantity,
                        memo: memo
                    }
                },
                {
                    account: config.contractName,
                    name: 'activate',
                    authorization: [{
                        actor: userAccount,
                        permission: 'active'
                    }],
                    data: {
                        memo: memo
                    }
                }
            ]
        }

        eos.transaction(
            trx,
            {
                broadcast: false,
                sign: false
            }
        ).then(res => {
            console.log(JSON.stringify(res.transaction.transaction, null, '  '))
        }).catch(err => {
            console.error("Error:", err)
        })
        break
    case 'rate':
        getRate(options.days).then(res => {
            console.log(res)
        })
        break
    default:
}




