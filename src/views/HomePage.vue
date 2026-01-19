<template>
  <div class="vkk-outer-container">
    <div class="vkk-paper-block">

      <header class="vkk-header">
        <h1 class="vkk-main-title">
          VARAJASE KAASAMISE KESKUS PAKUB NÕUSTAMIS- JA REHABILITATSIOONITEENUSEID TARTUS
        </h1>
        <p class="vkk-highlight-red">Oleme Sinu usaldusväärne partner lapse arenguteekonnal.</p>
      </header>

      <main class="vkk-main-content">
        <p class="vkk-intro">
          Meie nõustamiste ja koolituste eesmärgiks on abistada last, vanemat ja/või lapsega töötavat
          spetsialisti, ennetada õpiraskuste ja psüühikahäirete tekkimist ja toetada peresid.
        </p>

        <section class="vkk-services-section">
          <h2 class="vkk-services-title">Teenused:</h2>
          <p class="vkk-service-item">• Nõustamised lastele ja peredele, individuaalsed nõustamised täiskasvanutele</p>
          <p class="vkk-service-item">• Veebikoolitused lapsevanematele ja lastega töötavatele spetsialistidele</p>
          <p class="vkk-service-item">• Õpikeskkonna hindamine ja lasteasutuse sisekoolitused</p>
          <p class="vkk-service-item">• Tugiisiku- ja lapsehoiuteenus raske- ja sügava puudega lastele</p>
          <p class="vkk-service-item">• Sotsiaalne- ja tööalane rehabilitatsioon</p>
        </section>

        <section class="vkk-reasoning-section">
          <p class="vkk-reasoning-main">
            <span class="vkk-reasoning-label">Miks varajane kaasamine?</span>
            Loodame südamest, et lapse vajaduste varajane märkamine on toimunud õigeaegselt ning meie
            saame aidata last, peret ja teisi seotud osapooli kaasamise protsessis. Võtke lahkelt
            ühendust, otsime lahendusi!
          </p>

          <div class="vkk-quote-container">
            <p class="vkk-quote-text">
              Lapse aju arengust ja õpitava materjali hulga suurenemisest tulenevalt, võtab lapse
              kaasamine neljandas klassis neli korda rohkem aega kui see võtaks siis, kui sekkumisega
              alustada lasteaias.
            </p>
            <p class="vkk-source-tag">
              (Allikas: USA National Institute of Child Health and Human Development)
            </p>
          </div>
        </section>
      </main>

    </div>
  </div>
</template>

<style scoped>
/* Tumedam välimine taust */
.vkk-outer-container {
  background-color: #F5E9D0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
}

/* Valge plokk teksti jaoks */
.vkk-paper-block {
  background-color: #ffffff;
  max-width: 900px;
  width: 100%;
  padding: 60px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); /* Õrn vari, et plokk eristuks */
  color: #4a4a4a;
  font-family: Arial, sans-serif;
  line-height: 1.6;
}

/* Pealkirjad ja tekstid */
.vkk-main-title {
  color: #d4a76a;
  font-weight: 300;
  font-size: 2.2rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 25px;
  line-height: 1.2;
}

.vkk-highlight-red {
  color: #b55a30;
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 30px;
}

.vkk-intro {
  margin-bottom: 40px;
  font-size: 1.05rem;
}

.vkk-services-title {
  color: #d4a76a;
  font-size: 1.3rem;
  margin-bottom: 15px;
  font-weight: bold;
}

.vkk-service-item {
  margin: 8px 0;
  text-decoration: none; /* Veendume, et poleks allajoonitud */
}

.vkk-reasoning-section {
  margin-top: 50px;
}

.vkk-reasoning-label {
  color: #b55a30;
  font-weight: bold;
  margin-right: 5px;
}

.vkk-quote-container {
  margin-top: 40px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.vkk-quote-text {
  font-style: italic;
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 5px;
}

.vkk-source-tag {
  font-size: 0.85rem;
  color: #999;
}

/* Mobiili kohandused */
@media (max-width: 600px) {
  .vkk-paper-block {
    padding: 30px 20px;
  }
  .vkk-main-title {
    font-size: 1.6rem;
  }
}
</style>
