# Welcome to Cursor

# 1. Try generating with command K on a new line. Ask for a pytorch script of a feedforward neural network
# 2. Then, select the outputted code and hit chat. Ask if there's a bug. Ask how to improve.
# 3. Try selecting some code and hitting edit. Ask the bot to add residual layers.
# 4. To try out cursor on your own projects, go to the file menu (top left) and open a folder.

import requests
import matplotlib.pyplot as plt

# Make API request to get Bitcoin price data
response = requests.get('https://api.coindesk.com/v1/bpi/historical/close.json?start=2008-01-01&end=now')

# Convert response to JSON
data = response.json()

# Extract dates and prices from JSON
dates = list(data['bpi'].keys())
prices = list(data['bpi'].values())

# Plot Bitcoin price data
plt.plot(dates, prices)
plt.xlabel('Date')
plt.ylabel('Price (USD)')
plt.title('Bitcoin Price from 2008 to Present')
plt.show()