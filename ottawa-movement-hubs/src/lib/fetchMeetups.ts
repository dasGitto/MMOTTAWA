export async function fetchOttawaSportsMeetups() {
    const endpoint = 'https://api.meetup.com/gql';

    // GraphQL query targeting Ottawa coordinates (Lat: 45.4215, Lon: -75.6972)
    const query = `
    query {
      keywordSearch(input: {first: 15, lat: 45.4215, lon: -75.6972, query: "sports"}) {
        edges {
          node {
            id
            title
            dateTime
            eventUrl
            venue {
              name
              lat
              lon
            }
          }
        }
      }
    }
  `;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Token securely accessed on the server via .env.local
                'Authorization': `Bearer ${process.env.MEETUP_ACCESS_TOKEN}`
            },
            body: JSON.stringify({ query }),
            next: { revalidate: 3600 } // Cache data for 1 hour to prevent rate limits
        });

        const result = await response.json();

        // Normalize the data to match the hubs.json schema
        return result.data.keywordSearch.edges.map((edge: any) => ({
            id: edge.node.id,
            name: edge.node.title,
            description: `Live meetup event happening at ${edge.node.venue?.name || 'Ottawa'}.`,
            date: edge.node.dateTime,
            url: edge.node.eventUrl,
            lat: edge.node.venue?.lat || 45.4215,
            lng: edge.node.venue?.lon || -75.6972,
            category: "Live Event",
            type: "Community Meetup",
            zoom: 15
        }));

    } catch (error) {
        console.error("Failed to fetch meetups:", error);
        return []; // Fail gracefully so the map doesn't crash
    }
}
