"Durchsage" is an API for announcements like those on train stations or airports.

## Why?
My son loves trains these days and I wanted to have an easy way to generate announcements that can then be played through my phone, the home audio system, a raspberry or anything else one might think of. So while he is playing with his toy trains, every few minutes an announcement is coming from the shelf above him, much to his delight.

## Todo
The script should be able to handle a whole lot of use cases and it should be easy to add more languages. I might turn it into a more complex API that allows some customization.

## Usage
* Run yarn install
* Start the server with yarn start
* The server can be accessed with curl localhost:3009/v1

### Required parameters
* file: the config file, right now only trainstation-de_DE exists

### Optional parameters
* format: text is default, can be set to json

## Contribution
Feel free to add as many config files and/or translations as possible. Code fixes/improvements are also highly appreciated.