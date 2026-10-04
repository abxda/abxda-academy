# Preguntas de cultura general (en inglés, porque Pythia es un modelo en inglés) escritas para la lección
# «Alucinaciones y límites». Cada una lleva su categoría y las respuestas aceptadas (se comparan sin mayúsculas,
# sin acentos y sin signos). Son hechos estables y fáciles de comprobar; van de lo muy conocido a lo poco frecuente
# a propósito, para que el modelo acierte unas y falle otras. Licencia: las mismas que el resto del curso (contenido).
#
# Las cinco preguntas del encabezado de `build-data.py` (SHOTS) se usan como ejemplos en el prompt y NO están aquí.

Q = []
def add(cat, q, *ans): Q.append((cat, q, list(ans)))

# ── capitales ────────────────────────────────────────────────────────────────
for country, caps in [
    ('France', ['Paris']), ('Japan', ['Tokyo']), ('Italy', ['Rome']), ('Spain', ['Madrid']), ('China', ['Beijing', 'Peking']),
    ('Russia', ['Moscow']), ('Australia', ['Canberra']), ('Canada', ['Ottawa']), ('Brazil', ['Brasilia']), ('Egypt', ['Cairo']),
    ('Turkey', ['Ankara']), ('Switzerland', ['Bern', 'Berne']), ('New Zealand', ['Wellington']), ('Nigeria', ['Abuja']),
    ('India', ['New Delhi', 'Delhi']), ('Argentina', ['Buenos Aires']), ('Mexico', ['Mexico City', 'Ciudad de Mexico']),
    ('Austria', ['Vienna']), ('Netherlands', ['Amsterdam']), ('Belgium', ['Brussels']), ('Czech Republic', ['Prague']),
    ('Peru', ['Lima']), ('Chile', ['Santiago']), ('Colombia', ['Bogota']), ('Venezuela', ['Caracas']), ('Ecuador', ['Quito']),
    ('Uruguay', ['Montevideo']), ('Paraguay', ['Asuncion']), ('Norway', ['Oslo']), ('Sweden', ['Stockholm']),
    ('Finland', ['Helsinki']), ('Denmark', ['Copenhagen']), ('Iceland', ['Reykjavik']), ('Ireland', ['Dublin']),
    ('Portugal', ['Lisbon']), ('Greece', ['Athens']), ('Poland', ['Warsaw']), ('Hungary', ['Budapest']),
    ('Romania', ['Bucharest']), ('Bulgaria', ['Sofia']), ('Serbia', ['Belgrade']), ('Croatia', ['Zagreb']),
    ('Slovenia', ['Ljubljana']), ('Slovakia', ['Bratislava']), ('Estonia', ['Tallinn']), ('Latvia', ['Riga']),
    ('Lithuania', ['Vilnius']), ('Ukraine', ['Kyiv', 'Kiev']), ('Belarus', ['Minsk']), ('Moldova', ['Chisinau']),
    ('Georgia', ['Tbilisi']), ('Armenia', ['Yerevan']), ('Azerbaijan', ['Baku']), ('Uzbekistan', ['Tashkent']),
    ('Kyrgyzstan', ['Bishkek']), ('Tajikistan', ['Dushanbe']), ('Turkmenistan', ['Ashgabat']), ('Kazakhstan', ['Astana', 'Nur-Sultan', 'Nursultan']),
    ('Afghanistan', ['Kabul']), ('Pakistan', ['Islamabad']), ('Bangladesh', ['Dhaka']), ('Nepal', ['Kathmandu']),
    ('Bhutan', ['Thimphu']), ('Laos', ['Vientiane']), ('Cambodia', ['Phnom Penh']), ('Vietnam', ['Hanoi']),
    ('Thailand', ['Bangkok']), ('Malaysia', ['Kuala Lumpur']), ('Indonesia', ['Jakarta']), ('Philippines', ['Manila']),
    ('South Korea', ['Seoul']), ('Mongolia', ['Ulaanbaatar', 'Ulan Bator']), ('Myanmar', ['Naypyidaw', 'Nay Pyi Taw']),
    ('Ethiopia', ['Addis Ababa']), ('Kenya', ['Nairobi']), ('Ghana', ['Accra']), ('Senegal', ['Dakar']), ('Mali', ['Bamako']),
    ('Burkina Faso', ['Ouagadougou']), ('Niger', ['Niamey']), ('Chad', ['Ndjamena', 'N Djamena']), ('Sudan', ['Khartoum']),
    ('Angola', ['Luanda']), ('Zambia', ['Lusaka']), ('Zimbabwe', ['Harare']), ('Mozambique', ['Maputo']), ('Namibia', ['Windhoek']),
    ('Botswana', ['Gaborone']), ('Madagascar', ['Antananarivo']), ('Malawi', ['Lilongwe']), ('Rwanda', ['Kigali']),
    ('Uganda', ['Kampala']), ('Libya', ['Tripoli']), ('Tunisia', ['Tunis']), ('Morocco', ['Rabat']), ('Algeria', ['Algiers']),
    ('Eritrea', ['Asmara']), ('Somalia', ['Mogadishu']), ('Cameroon', ['Yaounde']), ('Gabon', ['Libreville']), ('Togo', ['Lome']),
    ('Suriname', ['Paramaribo']), ('Guyana', ['Georgetown']), ('Haiti', ['Port-au-Prince', 'Port au Prince']), ('Jamaica', ['Kingston']),
    ('Cuba', ['Havana']), ('Honduras', ['Tegucigalpa']), ('Nicaragua', ['Managua']), ('Belize', ['Belmopan']), ('Oman', ['Muscat']),
    ('Qatar', ['Doha']), ('Bahrain', ['Manama']), ('Jordan', ['Amman']), ('Lebanon', ['Beirut']), ('Iraq', ['Baghdad']),
    ('Iran', ['Tehran']), ('Syria', ['Damascus']), ('Brunei', ['Bandar Seri Begawan']), ('Fiji', ['Suva']),
    ('Papua New Guinea', ['Port Moresby']), ('Samoa', ['Apia']), ('Vanuatu', ['Port Vila']),
]:
    add('capital', f'What is the capital of {country}?', *caps)

# ── autores de obras ─────────────────────────────────────────────────────────
for work, auth in [
    ('Don Quixote', ['Cervantes', 'Miguel de Cervantes']), ('Hamlet', ['Shakespeare', 'William Shakespeare']),
    ('One Hundred Years of Solitude', ['Gabriel Garcia Marquez', 'Garcia Marquez']), ('Pedro Páramo', ['Juan Rulfo', 'Rulfo']),
    ('The Aleph', ['Jorge Luis Borges', 'Borges']), ('War and Peace', ['Leo Tolstoy', 'Tolstoy']),
    ('Crime and Punishment', ['Fyodor Dostoevsky', 'Dostoevsky', 'Dostoyevsky']), ('The Trial', ['Franz Kafka', 'Kafka']),
    ('Ulysses', ['James Joyce', 'Joyce']), ('Moby-Dick', ['Herman Melville', 'Melville']),
    ('Pride and Prejudice', ['Jane Austen', 'Austen']), ('Jane Eyre', ['Charlotte Bronte', 'Bronte']),
    ('Wuthering Heights', ['Emily Bronte', 'Bronte']), ('Frankenstein', ['Mary Shelley', 'Shelley']),
    ('Dracula', ['Bram Stoker', 'Stoker']), ('The Hobbit', ['J R R Tolkien', 'JRR Tolkien', 'Tolkien', 'J. R. R. Tolkien']),
    ('Nineteen Eighty-Four', ['George Orwell', 'Orwell']), ('Brave New World', ['Aldous Huxley', 'Huxley']),
    ('The Stranger', ['Albert Camus', 'Camus']), ('The Odyssey', ['Homer']), ('The Divine Comedy', ['Dante', 'Dante Alighieri']),
    ('Faust', ['Goethe', 'Johann Wolfgang von Goethe']), ('Les Misérables', ['Victor Hugo', 'Hugo']),
    ('Madame Bovary', ['Gustave Flaubert', 'Flaubert']), ('The Count of Monte Cristo', ['Alexandre Dumas', 'Dumas']),
    ('Candide', ['Voltaire']), ('Lolita', ['Vladimir Nabokov', 'Nabokov']),
    ('The Great Gatsby', ['F Scott Fitzgerald', 'Fitzgerald', 'F. Scott Fitzgerald']), ('To Kill a Mockingbird', ['Harper Lee']),
    ('The Catcher in the Rye', ['J D Salinger', 'Salinger', 'J. D. Salinger', 'JD Salinger']), ('Beloved', ['Toni Morrison', 'Morrison']),
    ('Things Fall Apart', ['Chinua Achebe', 'Achebe']), ('The Name of the Rose', ['Umberto Eco', 'Eco']),
    ('Love in the Time of Cholera', ['Gabriel Garcia Marquez', 'Garcia Marquez']), ('The House of the Spirits', ['Isabel Allende', 'Allende']),
    ('Hopscotch', ['Julio Cortazar', 'Cortazar']), ('The Labyrinth of Solitude', ['Octavio Paz', 'Paz']),
    ('The Death of Artemio Cruz', ['Carlos Fuentes', 'Fuentes']), ('The Savage Detectives', ['Roberto Bolano', 'Bolano']),
    ('The Master and Margarita', ['Mikhail Bulgakov', 'Bulgakov']), ('Doctor Zhivago', ['Boris Pasternak', 'Pasternak']),
    ('The Brothers Karamazov', ['Fyodor Dostoevsky', 'Dostoevsky', 'Dostoyevsky']), ('Anna Karenina', ['Leo Tolstoy', 'Tolstoy']),
    ('Dead Souls', ['Nikolai Gogol', 'Gogol']), ('Eugene Onegin', ['Alexander Pushkin', 'Pushkin']),
    ('The Plague', ['Albert Camus', 'Camus']), ('Siddhartha', ['Hermann Hesse', 'Hesse']), ('The Magic Mountain', ['Thomas Mann', 'Mann']),
    ('Steppenwolf', ['Hermann Hesse', 'Hesse']), ('Heart of Darkness', ['Joseph Conrad', 'Conrad']),
    ('Robinson Crusoe', ['Daniel Defoe', 'Defoe']), ("Gulliver's Travels", ['Jonathan Swift', 'Swift']),
    ('Oliver Twist', ['Charles Dickens', 'Dickens']), ('Middlemarch', ['George Eliot', 'Eliot']),
    ('Mrs Dalloway', ['Virginia Woolf', 'Woolf']), ('The Tin Drum', ['Gunter Grass', 'Grass']),
    ('Blindness', ['Jose Saramago', 'Saramago']), ('The Tale of Genji', ['Murasaki Shikibu', 'Murasaki']),
    ('Season of Migration to the North', ['Tayeb Salih', 'Salih']), ('Invisible Cities', ['Italo Calvino', 'Calvino']),
    ('The Book of Disquiet', ['Fernando Pessoa', 'Pessoa']), ('Pedro and the Captain', ['Mario Benedetti', 'Benedetti']),
]:
    add('author', f"Who wrote '{work}'?", *auth)

# ── símbolos químicos y números atómicos ─────────────────────────────────────
for el, sym in [('gold', 'Au'), ('silver', 'Ag'), ('iron', 'Fe'), ('lead', 'Pb'), ('sodium', 'Na'), ('potassium', 'K'), ('tin', 'Sn'),
                ('mercury', 'Hg'), ('tungsten', 'W'), ('copper', 'Cu'), ('antimony', 'Sb'), ('zinc', 'Zn'), ('nickel', 'Ni'),
                ('magnesium', 'Mg'), ('calcium', 'Ca'), ('helium', 'He'), ('neon', 'Ne'), ('argon', 'Ar'), ('chlorine', 'Cl'),
                ('phosphorus', 'P'), ('sulfur', 'S'), ('uranium', 'U'), ('platinum', 'Pt'), ('bromine', 'Br'), ('iodine', 'I'),
                ('silicon', 'Si'), ('lithium', 'Li'), ('boron', 'B')]:
    add('chem', f'What is the chemical symbol for {el}?', sym)
for el, z in [('hydrogen', 1), ('helium', 2), ('nitrogen', 7), ('oxygen', 8), ('neon', 10), ('sodium', 11), ('silicon', 14),
              ('calcium', 20), ('iron', 26), ('nickel', 28), ('copper', 29), ('zinc', 30), ('silver', 47), ('tin', 50),
              ('gold', 79), ('mercury', 80), ('lead', 82), ('uranium', 92)]:
    add('chem', f'What is the atomic number of {el}?', str(z))

# ── años ─────────────────────────────────────────────────────────────────────
for ev, y in [('the Berlin Wall fall', 1989), ('World War II end', 1945), ('the first Moon landing take place', 1969),
              ('the French Revolution begin', 1789), ('Columbus first reach the Americas', 1492),
              ('the United States Declaration of Independence get adopted', 1776), ('the Titanic sink', 1912),
              ('the Chernobyl disaster happen', 1986), ('the first iPhone go on sale', 2007),
              ('the Mexican War of Independence begin', 1810), ('the Russian Revolution take place', 1917),
              ('Constantinople fall to the Ottomans', 1453), ('the Magna Carta get sealed', 1215),
              ('the Wright brothers make their first powered flight', 1903), ('Sputnik 1 get launched', 1957),
              ('the atomic bomb fall on Hiroshima', 1945), ('the attack on Pearl Harbor happen', 1941),
              ('euro banknotes and coins enter circulation', 2002), ('the Battle of Waterloo take place', 1815),
              ('the Battle of Hastings take place', 1066), ('the Spanish Armada sail against England', 1588),
              ('the Berlin Wall get built', 1961), ('the Cuban Missile Crisis happen', 1962),
              ('President John F. Kennedy get assassinated', 1963), ('Yuri Gagarin orbit the Earth', 1961),
              ('Germany get reunified', 1990), ('the Hubble Space Telescope get launched', 1990),
              ('AlphaGo defeat Lee Sedol', 2016), ('Watson and Crick publish the structure of DNA', 1953),
              ('Fleming discover penicillin', 1928), ("Darwin publish On the Origin of Species", 1859), ("Newton publish the Principia", 1687),
              ('the Treaty of Versailles get signed', 1919), ('Krakatoa erupt', 1883), ('Mount St. Helens erupt', 1980),
              ('Hurricane Katrina hit New Orleans', 2005), ('the Fukushima nuclear accident happen', 2011),
              ('the Soviet Union dissolve', 1991), ('the Mexican Revolution begin', 1910), ('the Spanish Civil War begin', 1936),
              ('the Suez Canal open', 1869), ('the Panama Canal open', 1914), ('the Eiffel Tower get completed', 1889),
              ('the first modern Olympic Games take place in Athens', 1896), ('Wikipedia get launched', 2001),
              ('Google get founded', 1998), ('Facebook get launched', 2004), ('YouTube get founded', 2005),
              ("the paper 'Attention Is All You Need' get published", 2017)]:
    add('year', f'In what year did {ev}?', str(y))

# ── otros: monedas, arte, música, ciencia, tecnología, pensamiento ───────────
for c, cur in [('Japan', ['yen']), ('Switzerland', ['Swiss franc', 'franc']), ('India', ['rupee', 'Indian rupee']), ('Brazil', ['real', 'Brazilian real']),
               ('Poland', ['zloty']), ('Sweden', ['krona', 'Swedish krona']), ('Thailand', ['baht']), ('South Africa', ['rand']),
               ('Turkey', ['lira', 'Turkish lira']), ('Russia', ['ruble', 'rouble']), ('Hungary', ['forint']),
               ('the Czech Republic', ['koruna', 'Czech koruna']), ('Vietnam', ['dong']), ('South Korea', ['won']), ('Israel', ['shekel']),
               ('Norway', ['krone', 'Norwegian krone']), ('China', ['yuan', 'renminbi']), ('Indonesia', ['rupiah']), ('Malaysia', ['ringgit']),
               ('Saudi Arabia', ['riyal']), ('Nigeria', ['naira']), ('Ghana', ['cedi']), ('Ukraine', ['hryvnia']), ('Romania', ['leu']),
               ('Bulgaria', ['lev']), ('Guatemala', ['quetzal']), ('Cambodia', ['riel']), ('Mongolia', ['tugrik', 'togrog']), ('Bangladesh', ['taka']),
               ('Albania', ['lek']), ('Georgia', ['lari']), ('Kazakhstan', ['tenge']), ('Costa Rica', ['colon']), ('Honduras', ['lempira']),
               ('Paraguay', ['guarani']), ('Bolivia', ['boliviano']), ('Ethiopia', ['birr']), ('Botswana', ['pula']),
               ('Angola', ['kwanza'])]:
    add('currency', f'What is the currency of {c}?', *cur)

for work, a in [('the Mona Lisa', ['Leonardo da Vinci', 'Leonardo', 'da Vinci']), ('The Starry Night', ['Vincent van Gogh', 'van Gogh', 'Van Gogh']),
                ('Guernica', ['Pablo Picasso', 'Picasso']), ('The Persistence of Memory', ['Salvador Dali', 'Dali']),
                ('The Birth of Venus', ['Botticelli', 'Sandro Botticelli']), ('The Scream', ['Edvard Munch', 'Munch']),
                ('Girl with a Pearl Earring', ['Johannes Vermeer', 'Vermeer']), ('The Night Watch', ['Rembrandt']),
                ('Las Meninas', ['Diego Velazquez', 'Velazquez']), ('The Kiss (1908)', ['Gustav Klimt', 'Klimt']),
                ('The Garden of Earthly Delights', ['Hieronymus Bosch', 'Bosch']), ('The Last Supper', ['Leonardo da Vinci', 'Leonardo', 'da Vinci']),
                ('The Thinker sculpture', ['Auguste Rodin', 'Rodin']), ('American Gothic', ['Grant Wood']), ('Nighthawks', ['Edward Hopper', 'Hopper']),
                ('The Arnolfini Portrait', ['Jan van Eyck', 'van Eyck']), ('The Two Fridas', ['Frida Kahlo', 'Kahlo']),
                ("Campbell's Soup Cans", ['Andy Warhol', 'Warhol'])]:
    add('art', f'Who created {work}?' if work != 'The Thinker sculpture' else 'Who created the sculpture The Thinker?', *a)

for work, a in [('the Ninth Symphony with the Ode to Joy', ['Beethoven', 'Ludwig van Beethoven']), ('The Four Seasons', ['Vivaldi', 'Antonio Vivaldi']),
                ('The Magic Flute', ['Mozart', 'Wolfgang Amadeus Mozart']), ('Swan Lake', ['Tchaikovsky', 'Pyotr Ilyich Tchaikovsky']),
                ('The Rite of Spring', ['Stravinsky', 'Igor Stravinsky']), ('Boléro', ['Ravel', 'Maurice Ravel']),
                ('The Planets suite', ['Holst', 'Gustav Holst']), ('the Peer Gynt suites', ['Grieg', 'Edvard Grieg']),
                ('Clair de Lune', ['Debussy', 'Claude Debussy']), ('the Brandenburg Concertos', ['Bach', 'Johann Sebastian Bach']),
                ('the oratorio Messiah', ['Handel', 'George Frideric Handel']), ('the opera Carmen', ['Bizet', 'Georges Bizet']),
                ('the opera La Traviata', ['Verdi', 'Giuseppe Verdi']), ('the opera Tosca', ['Puccini', 'Giacomo Puccini']),
                ('the opera The Barber of Seville', ['Rossini', 'Gioachino Rossini'])]:
    add('music', f'Who composed {work}?', *a)

for q, a in [('Who discovered penicillin?', ['Alexander Fleming', 'Fleming']), ('Who proposed the heliocentric model in De revolutionibus?', ['Copernicus', 'Nicolaus Copernicus']),
             ('Who formulated the three laws of planetary motion?', ['Johannes Kepler', 'Kepler']), ('Who is credited with discovering the electron?', ['J J Thomson', 'Thomson', 'J. J. Thomson', 'JJ Thomson']),
             ('Who published the first widely recognized periodic table in 1869?', ['Dmitri Mendeleev', 'Mendeleev', 'Mendeleyev']),
             ('Who discovered radioactivity?', ['Henri Becquerel', 'Becquerel']), ('Who developed the first successful polio vaccine?', ['Jonas Salk', 'Salk']),
             ('Who is known as the father of genetics for his experiments with pea plants?', ['Gregor Mendel', 'Mendel']), ('Who discovered the neutron?', ['James Chadwick', 'Chadwick']),
             ('Who discovered X-rays?', ['Wilhelm Rontgen', 'Rontgen', 'Roentgen', 'Wilhelm Roentgen', 'Wilhelm Conrad Rontgen']),
             ('Who formulated the uncertainty principle?', ['Werner Heisenberg', 'Heisenberg']), ('Who invented dynamite?', ['Alfred Nobel', 'Nobel']),
             ('Who discovered the planet Uranus?', ['William Herschel', 'Herschel']), ('Who discovered the four largest moons of Jupiter?', ['Galileo', 'Galileo Galilei']),
             ('Who formulated the law of universal gravitation?', ['Isaac Newton', 'Newton']), ('Who invented the World Wide Web?', ['Tim Berners-Lee', 'Berners-Lee', 'Tim Berners Lee', 'Berners Lee']),
             ('Who proved Fermat\'s Last Theorem?', ['Andrew Wiles', 'Wiles']), ('Who proved the Poincaré conjecture?', ['Grigori Perelman', 'Perelman', 'Grigory Perelman']),
             ('Who introduced the Turing machine?', ['Alan Turing', 'Turing']), ('Who founded information theory in 1948?', ['Claude Shannon', 'Shannon']),
             ('Who designed the Analytical Engine?', ['Charles Babbage', 'Babbage']), ('Who wrote the first algorithm intended for the Analytical Engine?', ['Ada Lovelace', 'Lovelace']),
             ('Who first proposed what became the Big Bang theory?', ['Georges Lemaitre', 'Lemaitre']), ('Who showed in 1929 that the universe is expanding?', ['Edwin Hubble', 'Hubble']),
             ('Who discovered the first pulsars?', ['Jocelyn Bell Burnell', 'Jocelyn Bell', 'Bell Burnell']),
             ('Who created the Python programming language?', ['Guido van Rossum', 'van Rossum', 'Van Rossum']), ('Who created the Linux kernel?', ['Linus Torvalds', 'Torvalds']),
             ('Who created the C programming language?', ['Dennis Ritchie', 'Ritchie']), ('Who created C++?', ['Bjarne Stroustrup', 'Stroustrup']),
             ('Who created Java?', ['James Gosling', 'Gosling']), ('Who created the Ruby programming language?', ['Yukihiro Matsumoto', 'Matsumoto', 'Matz']),
             ('Who created Perl?', ['Larry Wall', 'Wall']), ('Who created JavaScript?', ['Brendan Eich', 'Eich']), ('Who created PHP?', ['Rasmus Lerdorf', 'Lerdorf']),
             ('Who started the Rust programming language?', ['Graydon Hoare', 'Hoare']), ('Who created the Pascal programming language?', ['Niklaus Wirth', 'Wirth']),
             ('Who led the creation of Fortran?', ['John Backus', 'Backus']), ('Who created the Lisp programming language?', ['John McCarthy', 'McCarthy']),
             ('Who co-founded Google with Sergey Brin?', ['Larry Page', 'Page']), ('Who founded Amazon?', ['Jeff Bezos', 'Bezos']),
             ('Who founded Oracle?', ['Larry Ellison', 'Ellison']), ('Who co-founded Nvidia and is its CEO?', ['Jensen Huang', 'Huang']),
             ('Who founded Facebook?', ['Mark Zuckerberg', 'Zuckerberg']), ('Who founded Apple with Steve Wozniak?', ['Steve Jobs', 'Jobs'])]:
    add('science_tech', q, *a)

for work, a in [('Critique of Pure Reason', ['Immanuel Kant', 'Kant']), ('The Wealth of Nations', ['Adam Smith', 'Smith']),
                ('The Prince', ['Machiavelli', 'Niccolo Machiavelli']), ('Leviathan', ['Thomas Hobbes', 'Hobbes']),
                ('Thus Spoke Zarathustra', ['Friedrich Nietzsche', 'Nietzsche']), ('The Communist Manifesto', ['Karl Marx', 'Marx', 'Engels', 'Friedrich Engels']),
                ('Being and Nothingness', ['Jean-Paul Sartre', 'Sartre', 'Jean Paul Sartre']), ('The Second Sex', ['Simone de Beauvoir', 'de Beauvoir', 'Beauvoir']),
                ('A Brief History of Time', ['Stephen Hawking', 'Hawking']), ('The Selfish Gene', ['Richard Dawkins', 'Dawkins']),
                ('Silent Spring', ['Rachel Carson', 'Carson']), ('Cosmos (1980)', ['Carl Sagan', 'Sagan']),
                ('The Structure of Scientific Revolutions', ['Thomas Kuhn', 'Kuhn']), ('The Republic', ['Plato']),
                ('Nicomachean Ethics', ['Aristotle']), ('Discourse on Method', ['Rene Descartes', 'Descartes']),
                ('The Social Contract', ['Jean-Jacques Rousseau', 'Rousseau']), ('On Liberty', ['John Stuart Mill', 'Mill']),
                ('The Interpretation of Dreams', ['Sigmund Freud', 'Freud']), ('Thinking, Fast and Slow', ['Daniel Kahneman', 'Kahneman']),
                ('Sapiens', ['Yuval Noah Harari', 'Harari']), ('Guns, Germs, and Steel', ['Jared Diamond', 'Diamond']),
                ('The Black Swan', ['Nassim Nicholas Taleb', 'Taleb', 'Nassim Taleb']), ('Capital in the Twenty-First Century', ['Thomas Piketty', 'Piketty']),
                ('The General Theory of Employment, Interest and Money', ['John Maynard Keynes', 'Keynes']), ('The Road to Serfdom', ['Friedrich Hayek', 'Hayek', 'F A Hayek']),
                ('Orientalism', ['Edward Said', 'Said']), ('Walden', ['Henry David Thoreau', 'Thoreau']), ('The Souls of Black Folk', ['W E B Du Bois', 'Du Bois', 'W. E. B. Du Bois', 'WEB Du Bois'])]:
    add('thinker', f"Who wrote '{work}'?" if work != 'Cosmos (1980)' else "Who wrote the book 'Cosmos' (1980)?", *a)
