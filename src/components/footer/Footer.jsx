import React from 'react'
import './Footer.css'

import facepeimg from '../../assets/facepeimg.png'
import cientistaLogo from '../../assets/cientistalogo.png'

import {
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt
} from 'react-icons/fa'

const Footer = () => {
  return (
    <footer className="footer-container">

      <div className="footer">

        <img
          src={cientistalogo}
          alt="Logo Cientista"
          className="CientistaLogo"
        />

        <div className="informacao">

          <div className="contato-item">

            <div className="contato-icon">
              <FaEnvelope />
            </div>

            <div className="contato-texto">
              <span className="contato-titulo">
                Email
              </span>

              <a href="mailto:contato@datasets.com.br">
                contato@datasets.com.br
              </a>
            </div>

          </div>

          <div className="contato-divisor" />

          <div className="contato-item">

            <div className="contato-icon">
              <FaPhoneAlt />
            </div>

            <div className="contato-texto">
              <span className="contato-titulo">
                Número
              </span>

              <a href="tel:+5581988829988">
                +55 (81) 98882-9988
              </a>
            </div>

          </div>

          <div className="contato-divisor" />

          <div className="contato-item">

            <div className="contato-icon">
              <FaMapMarkerAlt />
            </div>

            <div className="contato-texto">
              <span className="contato-titulo">
                Endereço
              </span>

              <a
                href="https://www.google.com/maps/place/Secretaria+de+Planejamento+e+Gest%C3%A3o/"
                target="_blank"
                rel="noopener noreferrer"
              >
                R. da Aurora, 1377 — Recife, PE
              </a>
            </div>

          </div>

        </div>

        <img
          src={facepeimg}
          alt="Logo Facepe"
          className="facepeimg"
        />

      </div>

    </footer>
  )
}

export default Footer
