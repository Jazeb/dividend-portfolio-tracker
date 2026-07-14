INSERT INTO "Sector" (id, name, icon)
VALUES
(1, 'Banking', 'icon.png'),
(2, 'Fertilizer', 'icon.png'),
(3, 'Oil & Gas Exploration', 'icon.png'),
(4, 'Power Generation', 'icon.png'),
(5, 'Cement', 'icon.png'),
(6, 'Technology', 'icon.png'),
(7, 'Textile Composite', 'icon.png'),
(8, 'Food & Personal Care', 'icon.png'),
(9, 'Pharmaceuticals', 'icon.png'),
(10, 'Investment Companies', 'icon.png');

INSERT INTO "Stock"
(symbol, "fullName", "currentPrice", "annualDividend", "dividendYield", icon, "sectorId")
VALUES
('MEBL', 'Meezan Bank Limited', 560.00, 28.00, 5.00, '/icons/mebl.png', 1),
('FABL', 'Faysal Bank Limited', 105.00, 7.00, 6.67, '/icons/fabl.png', 1),
('FFC', 'Fauji Fertilizer Company Limited', 620.00, 50.00, 8.06, '/icons/ffc.png', 2),
('ENGROH', 'Engro Holdings Limited', 385.00, 18.00, 4.68, '/icons/engroh.png', 2),
('OGDC', 'Oil & Gas Development Company Limited', 245.00, 22.00, 8.98, '/icons/ogdc.png', 3),
('POL', 'Pakistan Oilfields Limited', 840.00, 70.00, 8.33, '/icons/pol.png', '3'),
('HUBC', 'Hub Power Company Limited', 155.00, 15.00, 9.68, '/icons/hubc.png', 4),
('LUCK', 'Lucky Cement Limited', 1650.00, 30.00, 1.82, '/icons/luck.png', 5),
('SYS', 'Systems Limited', 820.00, 8.00, 0.98, '/icons/sys.png', 6),
('NML', 'Nishat Mills Limited', 170.00, 12.00, 7.06, '/icons/nml.png', 7);