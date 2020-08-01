# import necessary libraries
import sqlite3
import os
import io
import csv
import json
from flask import Flask, render_template, redirect, Response, request, jsonify, json, make_response
from flask_caching import Cache
from flask_sqlalchemy import SQLAlchemy
from splinter import Browser
import requests
from bs4 import BeautifulSoup


#################################################
# Flask Setup
#################################################
app = Flask(__name__)
cache = Cache(app,config={'CACHE_TYPE': 'simple'})

#################################################
# Database Setup
#################################################


def setup_SQLitedb():
    input_file = os.getcwd()+ r"\static\data\covid_data.csv"

    try:
        sqliteConnection = sqlite3.connect(os.getcwd()+ r"\static\data\SQLite_covid_data.db")
        cursor = sqliteConnection.cursor()
        cursor.fetchall()
        print("Database created and Successfully Connected to SQLite")

        with open(os.getcwd()+ r"\static\data\sqlite_create_tables.sql", "r") as sqlite_file:
            sql_script = sqlite_file.read()

        cursor.execute(sql_script)
        sqliteConnection.commit()
        print("SQLite table created")
        print(input_file)
        with open(input_file, newline='') as covid_data:
            reader = csv.reader(covid_data, delimiter=',')
            next (reader)
            for row in reader:
                sqlite_insert_query = "INSERT INTO usdata (datadate, uscounty, usstate, confirmed, deaths, active) VALUES ('" + row[0] + "','" + row[1] + "','" + row[2] + "'," + row[3] + "," + row[4] + "," + row[5] + ")"
                cursor.execute(sqlite_insert_query)
        print("Data import completed")
        sqliteConnection.commit()
        cursor.close()

    except sqlite3.Error as error:
        print("DB Operation:: ", error)


#################################################
# Query Builder
#################################################
def queryBuilder(startdate, enddate, uscounty, usstate):
    #flags used to write SQL query
    nodate = False
    nocounty = False

    #starter 
    sqlite_select_query = "SELECT datadate, uscounty, usstate, confirmed, deaths, active from usdata "
    
    #if all parameter values are not empty then create custom query
    if startdate != "" or enddate != "" or uscounty != "" or usstate !="":
        sqlite_select_query+= "where "
        
        #check for start and end date.  If only one provided, calculate accordingly
        if startdate != "" and enddate != "":
            sqlite_select_query += "datadate >= '" + startdate + "' and datadate <= '" + enddate + "' "
        elif startdate != "":
            sqlite_select_query += "datadate >= '" + startdate + "' "
        elif enddate != "":
            sqlite_select_query += "datadate <= '" + enddate + "' "
        else:
            nodate = True

        #check for county information, handling if date is not provided as a parameter
        if uscounty != "" and nodate == False:
            sqlite_select_query += "and uscounty = '" + uscounty + "' "
        elif uscounty != "" and nodate == True:
            sqlite_select_query += "uscounty = '" + uscounty + "' "
        else:
            nocounty = True

        #check for country information, handling if date or county data is unavailable
        if usstate != "":
            if nodate == False or nocounty == False:
                sqlite_select_query += "and usstate ='" + usstate + "' "
            else:
                sqlite_select_query += "usstate ='" + usstate + "' "

    #order data by date, then state, then county  
    sqlite_select_query+= "order by datadate, usstate, uscounty"
    return sqlite_select_query


#################################################
# JSON Builder
#################################################
def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def buildJsonFile(query):
    try:
        #connect to SQLits db
        sqliteConnection = sqlite3.connect(os.getcwd()+ r"\static\data\SQLite_covid_data.db")
        sqliteConnection.row_factory = dict_factory

        cursor = sqliteConnection.cursor()
        cursor.execute(query)
        querydata = cursor.fetchall()
        cursor.close()
        return querydata

    except sqlite3.Error as error:
        return("Failed to read data from sqlite table", error)
    finally:
        if (sqliteConnection):
            sqliteConnection.close()

#################################################
# Table Data Builder
#################################################

def readSqliteTable(query):
    try:
        #connect to SQLits db
        sqliteConnection = sqlite3.connect(os.getcwd()+ r"\static\data\SQLite_covid_data.db")
        cursor = sqliteConnection.cursor()
        cursor.execute(query)
        querydata = cursor.fetchall()
        cursor.close()
        return querydata
    except sqlite3.Error as error:
        return("Failed to read data from sqlite table", error)
    finally:
        if (sqliteConnection):
            sqliteConnection.close()

#################################################
# Web scrapper
#################################################
def covid_stat_Scrapper(): 

    wikiInfo = 'https://www.worldometers.info/coronavirus/country/us/'
    html_content = requests.get(wikiInfo).text
    
    # Create BeautifulSoup object; parse with 'lxml'
    soup = BeautifulSoup(html_content, 'lxml')
    data = []
    covid_table = soup.findAll("div", attrs={"id": "maincounter-wrap"})
    for tag in covid_table:
        if(tag.get_text() !=""):
            data.append(tag.get_text().strip('\n').replace('\n', ' '))

    return data
#################################################
# Application Route
#################################################
# create route that renders index.html template
@app.route("/")
def home():
    data = covid_stat_Scrapper()
    return render_template("index.html", confirmed=data[0], deaths=data[1], recovered=data[2])

@app.route("/custom")
def county():
        #starter message when you land on the table first time
        return render_template ("custom.html", msg="init")

@app.route("/custom/Search", methods=['POST'])
def countySearch():
    #Get input parameters from the webpage
    req = request.get_json()

    #Get input parameters from the json
    fromdate = req.get("fromdate")
    todate = req.get("todate")
    county = req.get("county")
    state = req.get("state")

    #build return json file
    query = queryBuilder(fromdate, todate, county, state)
    jsonFile = buildJsonFile(query)
    res = make_response(jsonify(jsonFile), 200)
    return res

@app.route("/heatmap")
def state():
    return render_template("heatmap.html")

@app.route("/faq")
def faq():
    return render_template("faq.html")

@app.route("/search", methods = ['GET', 'POST'])
def search():
    if request.method == "POST":
        #Get input parameters from the webpage
        fromdate = request.form["fromdate"]
        todate = request.form["todate"]
        county = request.form["county"]
        state = request.form["state"]

        #build query
        query = queryBuilder(fromdate, todate, county, state)
        #get query datatable 
        datatable = readSqliteTable(query)

        #identify number of rows for pagemsg
        rowcount = len(datatable)
        pagemsg = "Executed query returned " + str(rowcount) + " row(s)."

        return render_template('data.html', msg=pagemsg, data=datatable, fromdate=fromdate, todate=todate, county=county, state=state)
    else:
        #starter message when you land on the table first time
        pagemsg = "Please input parameters to search COVID-19 Data."
        return render_template ('data.html', msg=pagemsg)

if __name__ == "__main__":
    import webbrowser
    webbrowser.open("http://127.0.0.1:5000/")
    setup_SQLitedb()
    app.run()
