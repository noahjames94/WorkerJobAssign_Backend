#!/bin/bash

RED_COLOR='\033[0;31m'
GREEN_COLOR='\033[0;32m'
NC_COLOR='\033[0m'

# start react app server
  cd /opt/Re_ConEd/
  isValid=$( yarn check --verify-tree )
  echo -e $isValid
  if [[ $isValid == *"Folder in sync."* ]]
  then
    echo -e "${GREEN_COLOR}node_modules is up to date!"
  else
    echo -e "${RED_COLOR}node_modules in container is out of date, upgrade your container to get a good performance!"
    echo -e "${GREEN_COLOR}node_modules updating..."
  fi
  yarn install
  chmod -R 777 ./node_modules
  echo -e "${GREEN_COLOR}Start Node Server"
  yarn start:watch
