# Banking Application (Assignment) Server

## Software Versions

- Node: v14.6.0
- MySQL: v8.0.21

## Steps to run

1. `yarn install`
2. Create a database and user in MySQL
3. Update the database, username and password details in `.env` file
4. Run `yarn run setup:db` to create the tables in db
5. Run `yarn run start` to start the server

## Problem Statement

You need to create simple banking system. Create a Database 'Bank' with 2 tables user & accounts. Users table will have all users(bankers & customers). Accounts table will have all the entries of cash deposited & withdrawn.

1. Customer login
   -> Go to accounts page see all his/her transaction records
   -> Transaction page withdraw or deposit option => select any option => Enter the amount => Withdraw will deduct the amount & deposit will add to the balance amount. If amount entered is greater than the balance for withdrawal show message "No sufficient Fund"

2. Banker Login
   -> See total balance amount against all users
   -> Click on particular user & show his/her transactions

You will need to handle authentication using JWT Tokens and Knex with Mysql. This should be using the MVC Architecture.
