## Нагрузочное тестирование с помощью ApacheBenchmark
### Без nginx
```
[frok@frok-pc ~]$ ab -c 10 -n 1000 -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjA4OTMzNDk4LCJqdGkiOiI3YTZiODQ0YWU3MGU0ZjA2YTdjMWQyNDYyY2I1MDNjNyIsInVzZXJfaWQiOjF9._X__chgN_ebna-vvQgyi00W0ONnMpWDkgYvovHFk3lI" http://127.0.0.1:8000/games/ 
This is ApacheBench, Version 2.3 <$Revision: 1879490 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Completed 600 requests
Completed 700 requests
Completed 800 requests
Completed 900 requests
Completed 1000 requests
Finished 1000 requests


Server Software:        
Server Hostname:        127.0.0.1
Server Port:            8000

Document Path:          /games/
Document Length:        124 bytes

Concurrency Level:      10
Time taken for tests:   10.255 seconds
Complete requests:      1000
Failed requests:        0
Total transferred:      337000 bytes
HTML transferred:       124000 bytes
Requests per second:    97.52 [#/sec] (mean)
Time per request:       102.547 [ms] (mean)
Time per request:       10.255 [ms] (mean, across all concurrent requests)
Transfer rate:          32.09 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.0      0       0
Processing:    20  102   8.3    102     142
Waiting:       19  102   8.3    101     142
Total:         20  102   8.3    102     142

Percentage of the requests served within a certain time (ms)
  50%    102
  66%    104
  75%    106
  80%    107
  90%    111
  95%    115
  98%    125
  99%    129
 100%    142 (longest request)

```

### С nginx, без балансировки
```
[frok@frok-pc ~]$ ab -c 10 -n 1000 -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjA4OTMzNDk4LCJqdGkiOiI3YTZiODQ0YWU3MGU0ZjA2YTdjMWQyNDYyY2I1MDNjNyIsInVzZXJfaWQiOjF9._X__chgN_ebna-vvQgyi00W0ONnMpWDkgYvovHFk3lI" https://127.0.0.1/api/v1/games/ 
This is ApacheBench, Version 2.3 <$Revision: 1879490 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Completed 600 requests
Completed 700 requests
Completed 800 requests
Completed 900 requests
Completed 1000 requests
Finished 1000 requests


Server Software:        Jeopardy
Server Hostname:        127.0.0.1
Server Port:            443
SSL/TLS Protocol:       TLSv1.2,ECDHE-RSA-AES256-GCM-SHA384,4096,256
Server Temp Key:        X25519 253 bits

Document Path:          /api/v1/games/
Document Length:        124 bytes

Concurrency Level:      10
Time taken for tests:   9.566 seconds
Complete requests:      1000
Failed requests:        0
Total transferred:      411000 bytes
HTML transferred:       124000 bytes
Requests per second:    104.54 [#/sec] (mean)
Time per request:       95.657 [ms] (mean)
Time per request:       9.566 [ms] (mean, across all concurrent requests)
Transfer rate:          41.96 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        8   12   5.7     10      56
Processing:    15   83  14.5     82     144
Waiting:       14   83  14.5     82     144
Total:         31   95  15.7     94     168

Percentage of the requests served within a certain time (ms)
  50%     94
  66%    100
  75%    103
  80%    106
  90%    114
  95%    122
  98%    132
  99%    150
 100%    168 (longest request)
```

### С nginx, с балансировкой
```
[frok@frok-pc ~]$ ab -c 10 -n 1000 -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjA4OTMzNDk4LCJqdGkiOiI3YTZiODQ0YWU3MGU0ZjA2YTdjMWQyNDYyY2I1MDNjNyIsInVzZXJfaWQiOjF9._X__chgN_ebna-vvQgyi00W0ONnMpWDkgYvovHFk3lI" https://127.0.0.1/api/v1/games/ 
This is ApacheBench, Version 2.3 <$Revision: 1879490 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Completed 600 requests
Completed 700 requests
Completed 800 requests
Completed 900 requests
Completed 1000 requests
Finished 1000 requests


Server Software:        Jeopardy
Server Hostname:        127.0.0.1
Server Port:            443
SSL/TLS Protocol:       TLSv1.2,ECDHE-RSA-AES256-GCM-SHA384,4096,256
Server Temp Key:        X25519 253 bits

Document Path:          /api/v1/games/
Document Length:        124 bytes

Concurrency Level:      10
Time taken for tests:   6.381 seconds
Complete requests:      1000
Failed requests:        0
Total transferred:      411000 bytes
HTML transferred:       124000 bytes
Requests per second:    156.72 [#/sec] (mean)
Time per request:       63.810 [ms] (mean)
Time per request:       6.381 [ms] (mean, across all concurrent requests)
Transfer rate:          62.90 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        8   16   8.1     13      62
Processing:     9   47  28.0     40     132
Waiting:        9   47  28.0     40     132
Total:         18   63  28.7     59     165

Percentage of the requests served within a certain time (ms)
  50%     59
  66%     78
  75%     87
  80%     92
  90%    101
  95%    111
  98%    121
  99%    129
 100%    165 (longest request)
```

