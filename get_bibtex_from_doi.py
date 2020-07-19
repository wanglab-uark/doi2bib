'''get_bibtex_from_doi.py

Author: Yong Wang (yongwang@uark.edu)
Date:   07/19/2020
Copyright (c) Yong Wang @ University of Arkansas

This is part of the vscode extension (doi2bib). Likely I will convert it to 
typescript/javascript in the future.

This program is distributed in the hope that it will be useful, 
but WITHOUT ANY WARRANTY!
'''
import sys
import urllib.request
import requests

def get_bibtex(doi):
    '''get bibtex (str) from doi
    This is done through the metadata obtained from doi.org, just need to use the right header.
    See https://citation.crosscite.org/docs.html or 
    https://support.datacite.org/docs/datacite-content-resolver for details
    '''
    doi = doi.strip() # just to make sure leading no spaces
    if doi.lower().startswith('doi:'): # remove 'doi:' if it starts with it.
        doi = doi[4:].strip()
    url = 'https://doi.org/' + urllib.request.quote(doi)
    header = {
        'Accept': 'application/x-bibtex',
    }
    response = requests.get(url, headers=header)
    bibtex = response.text
    if bibtex.lower().find('doi not found')>=0:
        return '%s: DOI Not Found' % doi
    else:
        return bibtex

def modify_bibtex_key_with_3_title_words(bibtex):
    if bibtex.find('DOI Not Found')>=0:
        return bibtex
    # define the sets of characters or words to 
    chars_to_ignore = r'!@#$%^&*()=+,./<>?~`[]\{}|;:"'
    chars_to_space = '-_'
    words_to_ignore = ['this ','that ','and ','or ','a ','an ','the ','of ',
                        'as ','on ','via ','by ','in ','at ',
                        "'s ","' "]
    # split into lines: what needs to modify is the first line with the bib-key
    lines = bibtex.split('\n')
    # get the orginal bibkey: which has the format of Author_Year
    bibkey = lines[0].split('{')[-1].replace('_','').replace(',','')
    # get the title line
    for line in lines:
        if line.strip().startswith('title'):
            title = line.strip()
    title = title.split('=')[-1].lower()
    for c in chars_to_ignore:
        title = title.replace(c,'')
    for c in chars_to_space:
        title = title.replace(c,' ')
    for w in words_to_ignore:
        title = title.replace(w,'')
    # get the title words
    words = title.split()
    for i in range(len(words)):
        words[i] = words[i].strip().capitalize()
    # generate the new bibkey
    n = 3 if len(words)>3 else len(words)
    bibkey = bibkey+''.join(words[:n])
    newbibtex = lines[0].split('{')[0]+'{'+bibkey+',\n'
    # append all the other lines without change
    for i in range(1, len(lines)):
        newbibtex = newbibtex + lines[i] + '\n'
    return newbibtex

# main
if __name__ == '__main__':
    if len(sys.argv)>1:
        doi = sys.argv[1]
        print(modify_bibtex_key_with_3_title_words(get_bibtex(doi)))