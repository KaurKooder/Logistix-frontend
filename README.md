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
* avage intellij-s terminal ja sisestage command: npm install
* kontrollige kas backend poolel application käib
* sisestage command: npm run dev ja siis peaks tulema localhost link
* ! kui mingil põhjusel ei tööta, siis võib proovida commandi: npm run build ja seejärel npm run dev

## Vaadete vahel liikumine
Lehe üleval on navigatsiooniriba, kust saab lehtede vahel liikuda. Vaated: Avaleht, meist, blogi ja
artiklid, e-pood, koolitused, ostukorv, minu tellimused, konto.

# Meie lõpptulemus
Valmis ja töötavad funktsionaalsused:
* konto loomine/sisselogimine
* tavakasutaja: saab end registreerida kursustele, osta e-poest tooteid ning teha postitusi
* adminkasutaja: saab luua kursuseid, lisada e-poele tooteid juurde, saab samuti luua postitusi. (admin kasutaja loomise
* juhend asub backendi repo readme-s)

# Tööriistad
* Koodi kirjutamine: intelliJ
* Raamistik: vue
* Docker
* Gitlab
* Domain: http://vkkeskusdemo.hopto.org/
