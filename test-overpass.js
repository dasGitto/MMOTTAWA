

const query = `
[out:json][timeout:25];
(
  nwr["amenity"="community_centre"](45.37,-75.7,45.4,-75.65);
);
out body;
>;
out skel qt;
`;

const url = "https://overpass-api.de/api/interpreter";

fetch(url, {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
    headers: {
        "Content-Type": "application/x-www-form-urlencoded"
    }
})
    .then(res => res.json())
    .then(data => {
        const names = data.elements
            .filter(e => e.tags && e.tags.name)
            .map(e => e.tags.name);
        console.log(names);
    })
    .catch(err => console.error(err));
