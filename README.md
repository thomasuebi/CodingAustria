# Gemeinde-Bot

Wien bietet fortgeschrittenen Chatbot für eine einfache Kommunikation für die Bürger. Kleinere Gemeinden haben nicht die notwendigen Resourcen um in monatelange Entwicklung und Bot-Training zu investieren.

Die Lösung ist der Gemeinde-Bot, der innerhalb weniger Minuten für eine Gemeinde aufgesetzt wird. Er crawl automatisiert die Website der Gemeinde für richtige und aktuelle Informationen.

Features:

- Allgemeine Fragen zur Gemeinde und Geographie
- Shitchat
- Firmenbuchauszug (einfach Firmennummer mit angeben)

Potentielle Weiterentwicklungen:

- Ganze Behördenwege mit Identifizierung

## Technologie

Gemeinde-Bot setzt auf

- GPT-3 für Textverständnis und bauen von Texten
- IBM Watson Discovery für das Indexieren und intelligente Suchen von Information auf der Gemeinde-Website
- ReactJS im Frontend
- NodeJS Cloud Functions im Backend
- Firebase für's Deployment
- Rechnungsstelle API für Firmenbuchabfrage

## Setup

### 1) Dependencies installiseren

`npm install` und `cd functions && npm install && cd ..`

### 2) Gemeinde-Website indexieren

IBM Watson Discovery nutzen, um Website zu indexieren. Verwenden Sie die CollectionID und die EnvironmentID im nächsten Schritt.

### 3) Zugangsdaten zu den Dependency Services einrichten

Dazu `firebase functions:config:set` nutzen, um die folgenden Variablen einzurichten

```json
{
  "ibm": {
    "key": "",
    "collection": "",
    "url": "",
    "environment": ""
  },
  "verrechnungsstelle": {
    "key": "",
    "user": "",
    "password": ""
  },
  "openai": {
    "key": ""
  }
}
```

### 4) Lokal ausführen

`npm start`

### 5) Deployen

Firebase einrichten

`firebase deploy`
