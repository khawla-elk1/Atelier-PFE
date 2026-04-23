import urllib.request
import urllib.error
import json

try:
    urllib.request.urlopen('http://localhost:8081/api/anomalies')
    print("Success")
except urllib.error.HTTPError as e:
    data = json.loads(e.read().decode())
    print("ERROR MESSAGE:")
    print(data.get('message', data))
