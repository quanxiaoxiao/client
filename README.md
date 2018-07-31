## build

```shell
docker build -t test:1 .
```

## start

```shell
docker run --name test --restart=always -itd -p 3300:3000 -v $PWD/.:/api -e LOCAL_USER_ID=`id -u $USER` test:1
```
