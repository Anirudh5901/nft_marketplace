//external imports
import Script from "next/script";
import { ThemeProvider } from "next-themes"; //npm package to help switch between the light and the dark modes

//internal imports
import "../styles/globals.css";
import { Navbar, Footer } from "../components/index";
import { NFTProvider } from "../context/NFTContext";
import "../components/Spinner.css";

const MyApp = ({ Component, pageProps }) => (
  <NFTProvider>
    <ThemeProvider attribute="class">
      <div className="dark:bg-nft-dark bg-white min-h-screen">
        <Navbar />
        <div className="pt-65">
          <Component {...pageProps} />
        </div>

        <Footer />
      </div>

      <Script
        src="https://kit.fontawesome.com/eba5640083.js"
        crossorigin="anonymous"
      ></Script>
    </ThemeProvider>
  </NFTProvider>
);

export default MyApp;
