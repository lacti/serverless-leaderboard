# Serverless Leaderboard API

Almost same with [leaderboard-api](https://github.com/yingyeothon/leaderboard-api) but it uses,

- sqlite and [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3) to improve ranking search and update. ([on AWS Lambda layer](https://github.com/seanfisher/better-sqlite3-lambda-layer/))
- store sqlite database file into Redis to reduce latency.
- use hybrid strategy between locking and actor model for efficiency.

Thanks, [better-sqlite3-lambda-layer](https://github.com/seanfisher/better-sqlite3-lambda-layer)!

## Performance

- API Gateway + AWS Lambda + Redis on AWS Lightsail (\$3.5/mo)
- Do [cannon.js](cannon.js) and draw graph by [bashplotlib](https://github.com/glamp/bashplotlib)

Thanks, [bashplotlib](https://github.com/glamp/bashplotlib)!

```
node cannon.js > cannon.log
grep '^get' cannon.log | cut -d' ' -f2 | sort -n > cannon-get.log
grep '^put' cannon.log | cut -d' ' -f2 | sort -n > cannon-put.log
hist --file cannon-get.log --bins=160 -x
hist --file cannon-put.log --bins=160 -x
```

### Get scores

```
 1695|   o
 1606|   o
 1517|   o
 1428|   o
 1339|   o
 1249|   o
 1160|   o
 1071|   o
  982|   oo
  893|   oo
  803|   oo
  714|   oo
  625|   ooo
  536|   ooooo
  447|   oooooo
  357|  oooooooo
  268|  oooooooooooo
  179|  oooooooooooooo
   90|  oooooooooooooooo
    1| oooooooooooooooooooooooooooooooooooooooooooooooooooo   o           oooo o o oo oooooooooooo                  o    o   o                               oo ooo  ooo
      -----------------------------------------------------------------------------------------------------------------------------------------------------------------
      2 3 5 6 7 9 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 3 3 3 3 3 3 3 4 4 4 4 4 4 4 4 5 5 5 5 5 5 5 6 6 6 6 6 6 6 7 7 7 7 7 7 7 7 8 8 8 8 8 8 8 9 9 9 9 9 9 9 9 1 1 1 1 1 1 1 1
      5 8 2 5 9 2 0 1 3 4 6 7 8 0 1 2 4 5 6 8 9 0 2 3 4 6 7 9 0 1 3 4 5 7 8 9 1 2 3 5 6 8 9 0 2 3 4 6 7 8 0 1 2 4 5 6 8 9 1 2 3 5 6 7 9 0 1 3 4 5 7 8 9 0 0 0 0 0 0 0 1
        . . . . . 6 9 3 6 0 3 7 0 4 8 1 5 8 2 5 9 2 6 9 3 6 0 4 7 1 4 8 1 5 8 2 5 9 2 6 0 3 7 0 4 7 1 4 8 1 5 8 2 6 9 3 6 0 3 7 0 4 7 1 4 8 2 5 9 2 6 9 1 2 4 5 6 8 9 0
        5 0 6 1 6 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3 6 0 3 7 0 4 8
        3 7 1 5 8 2 7 3 8 3 9 4 9 5 0 6 1 6 2 7 2 8 3 9 4 9 5 0 5 1 6 2 7 2 8 3 8 4 9 5 0 5 1 6 1 7 2 8 3 8 4 9 4 0 5 1 6 1 7 2 7 3 8 4 9 4 0 5 0 6 1 7 . . . . . . .
        7 5 2   7 2 6   3 7 1 5 8 2 6   3 7 1 5 8 2 6   3 7 1 5 8 2 6   3 7 1 5 8 2 6   3 7 1 5 8 2 6   3 7 1 5 8 2 6   3 7 1 5 8 2 6   3 7 1 5 8 2 6   2 7 3 8 3 9 4

----------------------------------
|            Summary             |
----------------------------------
|       observations: 8561       |
|      min value: 25.000000      |
|        mean : 73.514075        |
|     max value: 1108.000000     |
----------------------------------
```

### Update score

```
 86|                                                                  o
 82|                                                                  o
 77|                                                                  o
 73|                                                               o  o
 68|                                                        o o    o  o       o
 64|                                o                      oo o o  o  o       o
 59|                                o                   o  oo o o  o  o    o  o
 55|                o o     o    o oo                   o  oooo o  o  o    o  o  o
 50|                o o    oo  o o oo      o            o  oooo oo oooo  o o  o  o
 46|               oooo o  oo oo o oooo    o           oo  oooo oo oooo oo o oo  o
 41|              ooooooo  oooooooooooooo  o        oo oo  oooo ooooooo oo ooooooo
 37|              ooooooo  ooooooooooooooo o        oo oo  ooooooooooooooooooooooo
 32|             ooooooooo ooooooooooooooo o  o     oo oo  ooooooooooooooooooooooo
 28|             oooooooooooooooooooooooooooooo o  ooooooo ooooooooooooooooooooooo o
 23|             oooooooooooooooooooooooooooooooo oooooooooooooooooooooooooooooooo o
 19|             ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo oo
 14|            ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo  o  o  o
 10|           ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo  oo oo oo        o
  5|          ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo    o oooo
  1| o o o  oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo oooooooooo  oo  o  o              o oooo oooo oo   o    o     o
    -----------------------------------------------------------------------------------------------------------------------------------------------------------------
    4 6 8 1 1 1 1 1 1 2 2 2 2 2 3 3 3 3 3 4 4 4 4 4 5 5 5 5 5 6 6 6 6 6 7 7 7 7 7 7 8 8 8 8 8 9 9 9 9 9 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
    6 5 4 0 2 4 6 8 9 1 3 5 7 9 1 3 5 7 9 1 3 4 6 8 0 2 4 6 8 0 2 4 6 8 0 1 3 5 7 9 1 3 5 7 9 1 3 5 6 8 0 0 0 0 0 1 1 1 1 1 2 2 2 2 2 2 3 3 3 3 3 4 4 4 4 4 5 5 5 5 5
      . . 3 2 2 1 0 9 9 8 7 6 6 5 4 3 3 2 1 0 9 9 8 7 6 6 5 4 3 3 2 1 0 0 9 8 7 7 6 5 4 3 3 2 1 0 0 9 8 0 2 4 6 8 0 2 4 6 8 0 1 3 5 7 9 1 3 5 7 9 1 3 5 6 8 0 2 4 6 8
      2 4 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7 7 6 5 4 4 3 2 1 1 0 9 8 7 7 6 5 4 4 3 2 1 1 0 9 8 8 7 6 5 5

-----------------------------------
|             Summary             |
-----------------------------------
|        observations: 3397       |
|       min value: 46.000000      |
|        mean : 511.491610        |
|      max value: 1585.000000     |
-----------------------------------
```

## License

MIT
