import Typewriter from "typewriter-effect";

const writerOptions = {
  delay: 85,
};

const WelcomeBanner = () => {
  return (
    <h1 className="text-center text-3xl font-bol">
      <Typewriter
        onInit={(typewriter) => {
          typewriter.typeString("ZeroLedger").start();
        }}
        options={writerOptions}
      />
    </h1>
  );
};

export default WelcomeBanner;
