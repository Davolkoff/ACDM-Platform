# ACDM Platform

>This project combines the functionality of the staking contract, voting contract and the new contract "ACDM Platform".
>The staking contract has not changed.
>The balance of DAO Voting now depends on the number of tokens sent to the staking contract. A "one of two" vote has also been added, where users choose one of the chairman's two proposals.
>Information about the first two contracts can be found in the readme of other repositories. 
>ACDM Platform has two states: trade round and sale round. During the sale round, you can buy ACDM tokens at a fixed price, during the trade round, users trade previously purchased ACDM tokens. Each round the fixed price increases. The round lasts 3 days.
>There is also a two-tier referral system on the platform. Commissions that are sent to referrals are set in the constructor or by voting.
-------------------------
# Table of contents
1. <b>Deploying</b>
 + [Deploy XXX token](#Deploy-XXX)
 + [Deploy ACDM token](#Deploy-ACDM)
 + [Mint and approve tokens](#Mintappr)
 + [Create pool](#Pool)
 + [Deploy staking contract](#Deploy-staking)
 + [Mint rewards tokens to staking contract](#MintSC)
 + [Deploy DAO voting contract](#Deploy-DAO)
 + [Deploy ACDM platform contract](#Deploy-platform)
2. <b>ACDM Platform functions (Sale round)</b> 
 + [Register](#Register)
 + [Start sale round](#Ssr)
 + [Buy ACDM tokens](#Buy)
3. <b>ACDM Platform functions (Trade round)</b>
 + [Start trade round](#Str)
 + [New order](#Neword)
 + [Remove order](#Remord)
 + [Redeem order](#Redord)
4. <b>Staking tasks</b> 
 + [Stake](#Stake)
 + [Claim](#Claim)
 + [Unstake](#Unstake)
5. <b>DAO Voting functions</b> 
 + [Add proposal](#Add-proposal)
 + [Add "one of two" proposal](#Add-oot-proposal)
 + [Vote](#Vote)
 + [Delegate vote](#Delegate)
 + [Finish voting](#Finish)
6. <b>Information functions (ACDM Platform)</b>
 + [Current state](#State)
 + [Comissions info](#Cominfo)
 + [Sale round info](#Srinfo)
 + [Order info](#Ordinfo)
7. <b>Information functions (Staking)</b>
 + [User balance](#Balance)
 + [Staking contract info](#Sinfo)
8. <b>Information functions (DAO Voting)</b>
 + [Voting information](#Voting-info)
 + [Settings information](#Settings-info)
-------------------------
## 1. Deploying

#### <a name="Deploy-XXX"></a> - Deploy XXX token (after executing this comand you'll see XXX token's address in terminal, it will be added to .env file):
```shell
npx hardhat run scripts/tokens/deployXXX.ts
```

#### <a name="Deploy-ACDM"></a> - Deploy ACDM token (after executing this comand you'll see XXX token's address in terminal, it will be added to .env file):
```shell
npx hardhat run scripts/tokens/deployACDM.ts
```

#### <a name="Mintappr"></a> - Mint and approve tokens (mints 30000 XXX tokens to your balance and approves them to router):
```shell
npx hardhat mintappr
```

#### <a name="Pool"></a> - Create pool (sends 30000 XXX Tokens and 0.3 ETH to luqidity pool. After executing this comand you'll see LP Token's address in terminal)
```shell
npx hardhat pool
```

#### <a name="Deploy-staking"></a> - Deploy staking contract (deploys staking contract, using addresses of contracts from .env)
```shell
npx hardhat run scripts/contracts/deployStaking.ts
```

#### <a name="MintSC"></a> - Mint rewards tokens to staking contract (mints 100 000 rewards tokens to your contract)
```shell
npx hardhat mintrewards
```

#### <a name="Deploy-DAO"></a> - Deploy DAO voting contract (deploys DAO voting contract, using addresses of contracts from .env)
```shell
npx hardhat run scripts/contracts/deployDAO.ts
```

#### <a name="Deploy-platform"></a> - Deploy ACDM platform contract (deploys ACDM platform contract, using addresses of contracts from .env)
```shell
npx hardhat run scripts/contracts/deployPlatform.ts
```

-------------------------
## 2. ACDM Platform functions (sale round):

#### <a name="Register"></a> - Register (sets your referrer and registers you on the platform)
```shell
Usage: hardhat [GLOBAL OPTIONS] register --referrer <STRING>

OPTIONS:

  --referrer    Your referrer 


Example:

npx hardhat register --referrer 0x5A31ABa56b11cc0Feae06C7f907bED9Dc1C02f95
```

#### <a name="Ssr"></a> - Start sale round (starts sale round. Allowed for all users after 3 days period)
```shell
npx hardhat ssr
```

#### <a name="Buy"></a> - Buy ACDM tokens (function for buying ACDM tokens at the sale round)
```shell
Usage: hardhat [GLOBAL OPTIONS] buy --amount <STRING>

OPTIONS:

  --amount      Amount of ETH you want to spend (in wei)


Example:

npx hardhat buy --amount 100000000000000000
```
-------------------------
## 3. ACDM Platform functions (trade round):

#### <a name="Str"></a> - Start trade round (starts trade round. Allowed for all users after 3 days period)
```shell
npx hardhat str
```

#### <a name="Neword"></a> - New order (creates a new token sale order at sale round)
```shell
Usage: hardhat [GLOBAL OPTIONS] neword --amacdm <STRING> --ameth <STRING>

OPTIONS:

  --amacdm      Amount of ACDM 
  --ameth       Amount of ETH (in wei)


Example:

npx hardhat neword --amacdm 1000000 --ameth 10000000000
```

#### <a name="Remord"></a> - Remove order (removes token sale order)
```shell
Usage: hardhat [GLOBAL OPTIONS] remord --id <STRING>

OPTIONS:

  --id  Order Id 


Example:

npx hardhat remord --id 43
```

#### <a name="Redord"></a> - Redeem order (redeems the order in whole or in part. If the order is fully redeemed, then the seller's last order takes the Id of this order)
```shell
Usage: hardhat [GLOBAL OPTIONS] redord --amount <STRING> --id <STRING> --seller <STRING>

OPTIONS:

  --amount      amount of ETH you want to spend (in wei) 
  --id          Order Id 
  --seller      Seller's address 


Example:

npx hardhat redord --id 43 --seller 
```
-------------------------
## 4. Staking functions:

#### <a name="Stake"></a> - Stake (stakes your LP tokens to contract's balance)
```shell
Usage: hardhat [GLOBAL OPTIONS] stake --amount <STRING>

OPTIONS:

  --amount      Amount of tokens 


Example:

npx hardhat stake --amount 10000000000000000000
```
 
#### <a name="Claim"></a> - Claim (withdraws your rewards tokens)
```shell
npx hardhat claim
```

#### <a name="Unstake"></a> - Unstake (withdraws your available LP tokens from contract)
```shell
npx hardhat unstake
```
-------------------------
## 5. DAO Voting functions:
>The validity period and the minimum number of votes for a successful vote is set in the "deployVoting.ts" file and is changed only by voting. Calldata, parameters, recipients and description for creating a new vote are set in the file "proposal_params.ts" in the root folder. Template of this file you can find in this repository.

#### <a name="Add-proposal"></a> <b>- Add proposal</b> (this function creates a new vote (can be called only by chairperson)):</b>

```shell
npx hardhat addpr
```

#### <a name="Add-oot-proposal"></a> <b>- Add "one of two" proposal</b> (this function creates two dependent votes (can be called only by chairperson)):</b>

```shell
npx hardhat addootpr
```

#### <a name="Vote"></a> <b>- Vote</b> (this function is used to vote for or against in the selected vote):</b>

```shell
Usage: hardhat [GLOBAL OPTIONS] vote --choice <STRING> --pid <STRING>

OPTIONS:

  --choice      1 - vote for proposal, 0 - against (For "one of two" 0 - first proposal, 1 - second) 
  --pid         Proposal ID 


Example:

npx hardhat vote --choice 1 --pid 42
```

#### <a name="Delegate-vote"></a> <b>- Delegate vote</b> (this function is used to delegate your vote to another user):</b>

```shell
Usage: hardhat [GLOBAL OPTIONS] delegate --pid <STRING> --to <STRING>

OPTIONS:

  --pid Proposal ID 
  --to  Delegate's address


Example:

npx hardhat delegate --to 0x5A31ABa56b11cc0Feae06C7f907bED9Dc1C02f95 --pid 41
```

#### <a name="Finish"></a> <b>- Finish voting</b> (this function finishes the voting):</b>

```shell
Usage: hardhat [GLOBAL OPTIONS] finish --pid <STRING>

OPTIONS:

  --pid Proposal ID


Example:

npx hardhat finish --pid 42
```
-------------------------
## 6. Information functions (ACDM Platform)
#### <a name="State"></a> - Current state (returns name of current round)
```shell
npx hardhat state
```

#### <a name="Cominfo"></a> - Comissions info (returns information about referrers comissions)
```shell
npx hardhat cominfo
```

#### <a name="Srinfo"></a> - Sale round info (returns information about token's price and volume on sale round)
```shell
npx hardhat srinfo
```

#### <a name="Ordinfo"></a> - Order info (returns information about selected order of selected user)
```shell
Usage: hardhat [GLOBAL OPTIONS] ordinfo --id <STRING> --seller <STRING>

OPTIONS:

  --id          Order Id 
  --seller      Seller's address 


Example:

npx hardhat ordinfo --id 12 --user 0x5A31ABa56b11cc0Feae06C7f907bED9Dc1C02f95
```
-------------------------
## 7. Information functions (Staking)
#### <a name="Balance"></a> - User balance (returns balance of selected user)
```shell
Usage: hardhat [GLOBAL OPTIONS] sbalance --user <STRING>

OPTIONS:

  --user        Address of user 


Example:

npx hardhat sbalance --scontract 0x8Fb1341Ec92eF0077a5106fde4c6fa77687FdA2d --user 0x5A31ABa56b11cc0Feae06C7f907bED9Dc1C02f95
```

#### <a name="Sinfo"></a> - Staking contract info (shows information about settings of staking contract)
```shell
npx hardhat stinfo
```

-------------------------
## 8. Information functions (DAO Voting)

#### <a name="Voting-info"></a> <b>- Voting information</b> (this function outputs voting information to the terminal):

```shell
Usage: hardhat [GLOBAL OPTIONS] vinfo --pid <STRING>

OPTIONS:

  --pid Proposal ID 


Example:

npx hardhat vinfo --pid 43
```

#### <a name="Settings-info"></a> <b>- Settings information</b> (this function outputs settings of voting contract to the terminal):

```shell
npx hardhat setinfo
```
-------------------------