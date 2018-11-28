# Chintai command line client
Chintai EOS leasing platform command line client

Alpha version:

1) Can check leasing rate and available EOS on the platform

`node chicmd.js -d 7 rate`

returns the rate and availability

2) Create borrow transaction

`node chicmd.js -a theaccount1 --amount 100 -d 7 -r 0.30`

this will spit out the transaction to feed to cleos to get 100 EOS staked at CPU for 7 days with interest 0.30%.
Might want to use it like this:

```
cleos push transaction `node chicmd.js -a theaccount1 --amount 100 -d 7 -r 0.30`
```

