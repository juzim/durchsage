"Durchsage" is an API for announcements. It can be used to generate texts to imitate airports, trainstations, satnavs etc.

A live version can be found at https://durchsage.herokuapp.com

## Why?
My son loves trains these days and I wanted to have an easy way to generate announcements that can then be played through my phone, the home audio system, a raspberry or anything else one might think of. So while he is playing with his toy trains, every few minutes an announcement is coming from the shelf above him, much to his delight.

## Todo
The script should be able to handle a whole lot of use cases and it should be easy to add more languages. I might turn it into a more complex API that allows some customization.

## Usage
* Run yarn install
* Start the server with yarn start
* Send a request to "http://host:port/v1/TEMPLATE", for example 'curl "http://localhost:8080/v1/trainstation-de_DE"'
* You can specify the action by appending it to the path ("http://localhost:8080/v1/trainstation-de_DE/welcome")
* To change the port (8080 is the default), set the PORT environment variable

## Paths
* GET VERSION/templates           list all available files
* GET VERSION/TEMPLATE/actions    list all available actions for a file
* GET VERSION/TEMPLATE            get text with random action
* GET VERSION/TEMPLATE/ACTION     get text with action  

## Frontend
There is a frontend available at at the root URL (http://localhost:8080) which utilizes the [SpeechAPI](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) and supports picking specific languages and actions. It can also be set to loop in random intervals for even more immersion.

## Contribution
Feel free to add as many config files and/or translations as possible. Code fixes/improvements are also highly appreciated.
