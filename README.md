# hotdog-or-not-hotdog

## Hi, thanks for coming by!
Welcome to my billion dollar investment idea inspired by Jin-Yang's 'Hot Dog or Not' app from HBO's Silicon Valley.

# EXAMPLE
![hotdog-or-not](https://user-images.githubusercontent.com/61921733/159380075-28953855-b0ff-4568-a3f9-b966da21d384.gif)

# USE
to get going, clone the repository and run `npm i`

You'll need to update the credentials with valid FireBase and GoogleCloud API keys if you want it to work!

## ABOUT
this app does exactly what you might think, it captures a photo (or you can upload one) and tells you if a hot dog is present in the image or not!
It is built using ReactNative and Expo on the client side.

The image recognition may seem insane but the credit goes to the great minds at google! The way it works is the image is sent to google vision and an array of tags comes back. The app simply parses the array to find instances of hot dogs and boom!
