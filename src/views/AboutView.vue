<<template>
  <div class="about-outer-container">
    <div class="about-paper-block">

      <header class="about-header-section">
        <h1 class="about-page-title">MEIST</h1>
      </header>

      <div class="about-grid-layout">
        <section class="about-column">
          <h2 class="about-section-title">
            MISSIOON <span class="about-ampersand">JA</span> VISIOON
          </h2>

          <div class="about-text-content">
            <p>
              Varajase Kaasamise Keskus OÜ missioon on pakkuda tuge ja osavõtlikkust lastele,
              täiskasvanutele ja nende tugivõrgustikule.
            </p>
            <p>
              Ettevõtte visioon on kujuneda lapsele, täiskasvanule ja nende tugivõrgustikule
              kompetentseks partneriks. Läbi oma teadmiste ja kogemuste panustame probleemide ennetamisse.
            </p>
          </div>
        </section>

        <section class="about-column">
          <h2 class="about-section-title">PÕHIVÄÄRTUSED</h2>

          <div class="about-values-list">
            <div class="about-value-item">
              <h3 class="about-value-header">Avatud ja läbipaistev suhtlemine</h3>
              <p>
                Peame oluliseks usalduslikke ja vastastikusel austusel põhinevaid koostööle suunatud
                suhteid klientide, kolleegide, teiste organisatsioonide ja üldsusega.
              </p>
            </div>

            <div class="about-value-item">
              <h3 class="about-value-header">Professionaalsus/asjatundlikkus</h3>
              <p>
                Oleme oma töös kompetentsed ja tunneme põhjalikult oma töökorraldust ja pakume
                kvaliteetset <span class="about-text-red">teenust</span>. Usume oma töötajate ja klientide võimetesse ja oskustesse.
              </p>
            </div>

            <div class="about-value-item">
              <h3 class="about-value-header">Järjepidevus / pidev areng</h3>
              <p>
                Peame oluliseks pidevat arendustegevust kliendi, töötaja ja organisatsiooni tasandil.
              </p>
            </div>

            <div class="about-value-item">
              <h3 class="about-value-header">Tolerantsus</h3>
              <p>
                Aktsepteerime inimest sellisena nagu ta on, austame üksteise eetilisi väärtusi ja veendumusi.
              </p>
            </div>
          </div>
        </section>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Taust ja konteiner */
.about-outer-container {
  background-color: #F5E9D0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  font-family: Arial, sans-serif;
}

.about-paper-block {
  background-color: #ffffff;
  max-width: 1100px;
  width: 100%;
  padding: 60px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  color: #4a4a4a;
  line-height: 1.6;
}

.about-header-section {
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 50px;
  padding-bottom: 10px;
}

.about-page-title {
  font-weight: 300;
  font-size: 2.2rem;
  color: #d4a76a;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.about-section-title {
  font-weight: 300;
  font-size: 1.8rem;
  color: #d4a76a;
  margin-bottom: 25px;
  text-transform: uppercase;
}

.about-ampersand {
  color: #d4a76a;
  font-size: 1.2rem;
  vertical-align: middle;
}

/* Gridi paigutus */
.about-grid-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 60px;
}

/* Sisu tekstid */
.about-text-content p {
  margin-bottom: 20px;
  font-size: 0.95rem;
}

/* Väärtused paremal */
.about-value-item {
  margin-bottom: 25px;
}

.about-value-header {
  color: #b55a30;
  font-size: 1rem;
  text-decoration: underline;
  margin-bottom: 10px;
  font-weight: normal;
}

.about-text-red {
  color: #b55a30;
}

/* Mobiilivaade */
@media (max-width: 850px) {
  .about-grid-layout {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .about-paper-block {
    padding: 30px 20px;
  }
}
</style>
