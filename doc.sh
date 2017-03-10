#!/bin/bash
git checkout gh-pages
git reset --hard origin/master
./node_modules/.bin/jsdoc -c jsdoc.json -R README.md -d . src/*.js
git add .
git commit -m 'bump doc'
git push -fu origin gh-pages
git checkout master

