#!/usr/bin/env bash

mongo 'mongodb://127.0.0.1:27017/admin' --eval 'db.getSiblingDB("RIDO-Test").dropDatabase();'
mongo 'mongodb://127.0.0.1:27017/admin' --eval 'db.getSiblingDB("RIDO-Test-logs").dropDatabase();'
mongo 'mongodb://127.0.0.1:27017/admin' --eval 'db.getSiblingDB("RIDO-Test-logs-trace").dropDatabase();'