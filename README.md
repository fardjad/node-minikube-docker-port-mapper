# minikube Docker Port Mapper

> Automated Docker port mapping for minikube

## Motivation

minikube can (almost) be used as a drop-in replacement for Docker Desktop. 
One of the drawbacks of doing so is that the published ports from the containers running in minikube VM are only accessible through the host-only adapter associated with minikube VM. 
This project aims to mimic the [Docker Desktop port mapping feature](https://docs.docker.com/desktop/mac/networking/#port-mapping), by automatically creating forwarding proxies from `localhost` to minikube IP for published ports.

## Installation

### Requirements
1. minikube
2. Node.js v14+

You'd probably want to follow [this guide](https://medium.com/rahasak/replace-docker-desktop-with-minikube-and-hyperkit-on-macos-783ce4fb39e3) for replacing Docker Desktop with minikube

### Usage

```bash
minikube start 
npx minikube-docker-port-mapper

# in another terminal session
eval $(minikube docker-env)
docker run -d --name nginxhello -p 8080:80 nginxdemos/hello
curl -i localhost:8080
docker rm -f nginxhello
```
