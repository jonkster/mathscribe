# Math Scribe

A simple web application to assist people with handwriting difficulties show
written arithmetical working.

It uses a neural net based OCR web service to recognise drawn figures built
using [convnetjs](https://github.com/karpathy/convnetjs).

## To install

clone repository

```npm install```
```npm start```

This will start the OCR web service and application.

NB
Currently the neural net training and configuration is done externally and the
resulting configuration uploaded as a JSON representation to this repository in
the file [nnew.json](./ws/neuralnet/nnew.json).






