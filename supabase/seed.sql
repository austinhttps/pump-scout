-- ILLUSTRATIVE DEMO STATION CATALOG. Verify addresses and coordinates before production.
-- No sample prices are inserted into the live database.
insert into public.stations(id,name,brand,address,city,zip,lat,lng,membership) values
('station-1','Costco','Costco','2838 Wake Forest Rd','Raleigh, NC','27609',35.8215,-78.621,true),
('station-2','Sam''s Club','Sam''s Club','2537 S Saunders St','Raleigh, NC','27603',35.7461,-78.6464,true),
('station-3','Sheetz','Sheetz','5200 New Bern Ave','Raleigh, NC','27610',35.7975,-78.5545,false),
('station-4','Circle K','Circle K','2720 Lake Wheeler Rd','Raleigh, NC','27603',35.7452,-78.6702,false),
('station-5','Shell','Shell','1610 Glenwood Ave','Raleigh, NC','27608',35.8045,-78.6478,false),
('station-6','Exxon','Exxon','1701 Capital Blvd','Raleigh, NC','27604',35.802,-78.6232,false),
('station-7','BP','BP','4101 Glenwood Ave','Raleigh, NC','27612',35.8332,-78.6695,false),
('station-8','Marathon','Marathon','1201 S Wilmington St','Raleigh, NC','27601',35.7652,-78.639,false),
('station-9','Speedway','Speedway','3912 Western Blvd','Raleigh, NC','27606',35.7854,-78.6921,false),
('station-10','Valero','Valero','2810 Hillsborough St','Raleigh, NC','27607',35.7903,-78.6748,false),
('station-11','Shell','Shell','3300 New Bern Ave','Raleigh, NC','27610',35.7894,-78.5864,false),
('station-12','Exxon','Exxon','3600 S Wilmington St','Raleigh, NC','27603',35.7295,-78.6508,false),
('station-13','Sheetz','Sheetz','1000 N Rogers Ln','Raleigh, NC','27610',35.8049,-78.5414,false),
('station-14','BP','BP','2501 Blue Ridge Rd','Raleigh, NC','27607',35.8151,-78.703,false),
('station-15','Circle K','Circle K','4400 Falls of Neuse Rd','Raleigh, NC','27609',35.8411,-78.611,false),
('station-16','Speedway','Speedway','2401 Capital Blvd','Raleigh, NC','27604',35.8138,-78.6063,false)
on conflict(id) do nothing;
