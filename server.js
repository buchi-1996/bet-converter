import express from 'express';
import axios from 'axios';
import cors from 'cors'; // Import cors

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

app.use(express.json());




// Utility function to get bookie share link URL
const getBookieShareLinkUrl = (code, country, name) => {
  const football = `https://www.football.com/api/${country}/orders/share/${code}`;
  const sportybet = `https://www.sportybet.com/api/${country}/orders/share/${code}`;
  const msport = `https://www.msport.com/api/${country}/orders/real-sports/order/share/${code}`;
  const bangbet = "https://bet-api.bangbet.com/api/bet/booking";
  const stake = `https://stake.com/_api/graphql`;

  const bookies = {
    football,
    sportybet,
    msport,
    bangbet,
    stake,
  };

  return bookies[name];
};

const getBookiePostLinkUrl = (country, name) => {
    const football = `https://www.football.com/api/${country}/orders/share`;
    const sportybet = `https://www.sportybet.com/api/${country}/orders/share`;
    const msport = `https://www.msport.com/api/${country}/orders/real-sports/order/share`;
    const bangbet = "https://bet-api.bangbet.com/api/bet/booking";
    const stake = `https://stake.com/_api/graphql`;
  
    const bookies = {
      football,
      sportybet,
      msport,
      bangbet,
      stake,
    };
  
    return bookies[name];
  };
  





// API Route to convert a booking code from one bookie to another
app.post('/api/convert-booking', async (req, res) => {
  const { fromBookie, toBookie, code, country } = req.body;

  try {
    // Step 1: Get Booking from the source bookie
    const fromUrl = getBookieShareLinkUrl(code, country, fromBookie);

    const response = await axios.get(fromUrl);

    if (!response.data) {
      return res.status(404).json({ error: 'No data returned from the source bookie' });
    }

    const bookingDetails = response.data.data;

    console.log(bookingDetails.outcomes[0].markets[0].outcomes)

    // Step 2: Prepare data to convert to target bookie


    const buildSportyBet = (data) => {
        let newbet = []
        data.outcomes.map(bet => {
            bet.markets.map(market => {
                market.outcomes.map(outcome => {
                    const betData = {
                        eventId: bet.eventId,
                        marketId: market.id,
                        specifier: market.specifier || null,
                        outcomeId: outcome.id,
                    }
                    newbet.push(betData)
                })
            })
        })
        return newbet
    }

    const conversionData = {selections: buildSportyBet(bookingDetails)}
    console.log('conversion Data', conversionData)

    

    // Step 3: Post to the target bookie's API
    const toUrl = getBookiePostLinkUrl(country, toBookie); // Empty code because we're sending new data

    console.log('POST URL:', toUrl);
    console.log('Conversion Data:', JSON.stringify(conversionData, null, 2));

    const convertResponse = await axios.post(toUrl, conversionData, {
        headers: {
          "Content-Type": "application/json",
        }});
        
    if (convertResponse.status === 200) {
      return res.status(200).json({ message: 'Booking converted successfully', data: convertResponse.data });
    } else {
      return res.status(500).json({ error: `Failed to convert booking: ${convertResponse.statusText}` });
    }
  } catch (error) {
    console.error(`Error converting booking: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});






// API Route to fetch booking details
app.get('/api/get-booking/:bookie/:country/:code', async (req, res) => {
  const { bookie, country, code } = req.params;

  try {
    const url = getBookieShareLinkUrl(code, country, bookie);
    const response = await axios.get(url);

    if (response.status === 200) {
      return res.status(200).json({ data: response.data });
    } else {
      return res.status(response.status).json({ error: response.statusText });
    }
  } catch (error) {
    console.error(`Error fetching booking: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});





// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
