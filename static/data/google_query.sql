## Query for database creation
SELECT date, admin2, province_state, confirmed, deaths, active FROM `bigquery-public-data.covid19_jhu_csse.summary`
where admin2 is not null and admin2 <> "O'Brien" and admin2 <> "Prince George's" and admin2 <> "Queen Anne's" and admin2 <> "St. Mary's" and admin2 <> "Unassigned" 
and fips is not null



## Query for index.html page
SELECT province_state as state, sum(confirmed) as confirmed, sum(deaths) as deaths FROM `bigquery-public-data.covid19_jhu_csse.summary`
where fips is not null and province_state is not null and confirmed <> 0 and date = "2020-07-30"
group by province_state
order by province_state