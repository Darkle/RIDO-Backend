#!/usr/bin/env bash

mongo 'mongodb://127.0.0.1:27017/admin' --eval 'db.getSiblingDB("RIDOdb-Test").dropDatabase();'
mongo 'mongodb://127.0.0.1:27017/admin' --eval 'db.getSiblingDB("RIDOdb-Test-logs").dropDatabase();'
mongo 'mongodb://127.0.0.1:27017/admin' --eval 'db.getSiblingDB("RIDOdb-Test-logs-trace").dropDatabase();'