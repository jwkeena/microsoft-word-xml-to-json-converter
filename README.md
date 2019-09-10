# microsoft-word-xml-to-json-converter
A custom tool to parse MS Word XML documents formatted as letter correspondence into JavaScript objects.

# the problem
I needed a quicker, more efficient, and more powerful way to search through the Collected Letters of C.S. Lewis than the sometimes-inaccurate indices of the print version and the incomplete Google Books or Amazon Preview versions. Realizing that MS Word documents are natively written in XML, I set about turning the electronic copies of the letters into JS objects.

# formatting
The project was built with a very specific format in mind. The MS Word text must be like this in structure: 

TO CORRESPONDENT (ARCHIVAL LOCATION): <--"TO" must be in all caps to use the program as written
  Letter content, with footnote numbers.
  Footnotes with footnote text.
Page number

for example:

TO JOY GRESHAM (BODLEIAN):
The Kilns, Headington Quarry, Oxford. Jan 1, 1950.
My dear Joy,
Did you know we'll be married eventually? TWICE, in fact? 1 I don't really know what that means yet, but I guess You could say I'll be Suprised by Joy. How ironic! Yours, Jack

1 Lewis married Joy Gresham in a civil ceremony to prevent her from being deported back to America. Later, they married in the Anglican church, after Joy was diagnosed with bone cancer.
556

# usage
Given that all the letters were formatted that way, my program can predict which numbers are footnotes and which are page numbers, and a number of other things impossible without customization for this particular problem. The code is designed to be done year by year and volume by volume: i.e., each time running the program on a new chapter requires the user to manually enter in the Letter constructor which volume one is using (if desired), which year is being parsed, and what page the chapter begins on. 

The XML file must be hosted somewhere online first. After the program runs, it spits out the converted JS into a textbox in the html page. Copy and paste that JS into an IDE, and see the results prettified.

# application
The JavaScript objects built from this program provide the foundation for the search engine built on top of them: https://jwkeena.github.io/csl-letters/
