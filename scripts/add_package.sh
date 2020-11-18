#!/bin/bash

RED_COLOR='\033[0;31m'
GREEN_COLOR='\033[0;32m'
NC_COLOR='\033[0m'

function add_package() {
  script="source /opt/Re_ConEd/scripts/add_package_in_docker.sh && add_package_in_docker $@"
  docker-compose exec reconed bash -c "$script"
  docker-compose exec reconed bash -c "yarn"
  docker-compose restart reconed
}
add_package $@
