# Projekti autorid
Helena Joost</br>
Kaur Drenkhan

# Projekti tutvustus
Teeme olemasolevat veebilehte nullist: https://www.vkkeskus.ee/. Tegemist on keskusega, mis pakub lastele ja vanematele
nõustamis - ja rehabilitatsiooniteenuseid. Veebilehel on olemas koolituste leht, kus saab end registreerida koolitusele,
e-pood, kust saab osta erinevaid tooteid k.a koolitust, ning ka blogileht, kus saab lugeda selle teemaga seonduvaid
artikleid.</br>

Miks on vaja seda veebilehte paremaks teha? - praegusel veebilehel puudub korralik backend ja läheb tihti rikki. Meie
soovime luua parema ja töötava veebilehe.

# Projekti seadistamise juhend

## Node js
Kõigepealt kontrollige kas node.js on arvutisse installitud:
* avage cmd või windows powershell
* sisestage commandid: node -v, npm -v
* kui arvuti ei leia üles, siis avage lehekülg: https://nodejs.org/ - ja sealt installige node.js
* tehke intellij-s restart

## Frontend poole käivitamine
* avage intellij-s terminal ja sisestage commandid: npm install ning npm install axios
* kontrollige kas backend poolel application käib
* sisestage command: npm run dev ja siis peaks tulema localhost link
* ! kui mingil põhjusel ei tööta, siis võib proovida commandi: npm run build ja seejärel npm run dev

## Vaadete vahel liikumine
Lehe üleval on navigatsiooniriba, kust saab lehtede vahel liikuda. Praegu on valmis esialgsed vaated: konto, blogi ja
artiklid, e-pood, koolitused.

# Tööriistad
* Koodi kirjutamine: intelliJ
* Raamistik: vue
* Docker
* Gitlab
* Domain: vkkeskusdemo.publicvm.com (hetkel ei näita midagi, parandusel)
