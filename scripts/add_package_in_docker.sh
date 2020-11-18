#!/bin/bash

function add_package_in_docker() {
  cd /opt/Re_ConEd/
  yarn add $@
}
