# Norman Sicily Monastic Order Location Quotients Choropleth Map

This is an example Choropleth map showing the location quotients for Norman
Sicilian monastic orders.

## Location Quotients

According to the Bureau of Economic Analysis, "A location quotient (LQ) is an
analytical statistic that measures a region’s industrial specialization
relative to a larger geographic unit (usually the nation)".<sup>[1](#footnote1)</sup>

Location quotients are calculated by a three step method:
1. Divide the local industry employment by the all industry total of local
employment.
1. Divide reference area industry employment by the all industry total of
reference area employment.
1. Divide the local ratio by the reference area employment.

Normally, "local" denotes a state or region while "reference area" denotes a
nation.

A location quotient of greater than 1.0 indicates the industry has a greater
share of local employment than does the reference area.<sup>[2](#footnote2)</sup>

In this example, I am applying the location quotient concept to the number of
monastic foundations by order in Norman Sicily. I hope to identify
concentrations of orders in certain provinces of Sicily. In my model, the
monastic order replaces the concept of industry. For regions, the modern
provinces are used, while the reference area is the whole of Sicily.

## Data

The data for monastic foundations by order are drawn from Lynn White's *Latin
Monasticism in Norman Sicily*<sup>[3](#footnote3)</sup>. In it, White gives a list of monasteries founded
in the Norman period of Sicilian history (1060-1194 CE).
[Dawn Marie Hayes](http://www.thehayesweb.org/dhayes/) has assigned each of
these foundations a location in one of the modern provinces of Sicily.

Where the order of the foundation was in doubt...

Where the location of the foundation was in doubt...

## Files

* example.html - modified version of Leaflet's example of an
[interactive choropleth map](http://leafletjs.com/examples/choropleth/example.html)
* it_sicilia_provinces.geojson - geojson file containing modern provinces for
Sicily. From https://github.com/Dataninja/geo-shapes.git (italy region 19).
* orders_data.json - JSON file with the location quotient by monastic order by
province
* config.js.sample - edit this file to add your MapBox access token. Save and
rename it to config.js. **IMPORTANT! DO NOT COMMIT THIS FILE!**

## License

Copyright © 2017 Joseph P. Hayes

Released under the MIT license.

***

**NOTES**

<a name="footnote1">1.</a> U.S. Bureau of Economic Analysis, FAQ:
["What are location quotients (LQs)?"](https://www.bea.gov/faq/index.cfm?faq_id=478) (Jan. 11 2008)

<a name="footnote2">2.</a> Bureau of Labor Statistics, Help & Tutorials:
["Location Quotient Calculator"](https://www.bls.gov/help/def/lq.htm) (June 21, 2013)

<a name="footnote3">3.</a> White, Lynn Townsend, *Latin Monasticism In Norman
Sicily*. Cambridge, Mass.: Mediaeval Academy of America, 1938.
