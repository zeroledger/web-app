import Typewriter from "typewriter-effect";

const writerOptions = {
  delay: 85,
};

const MainBanner = () => {
  return (
    <>
      <h1 className="text-center text-3xl font-bol">
        <Typewriter
          onInit={(typewriter) => {
            typewriter.typeString("Pryx App").start();
          }}
          options={writerOptions}
        />
      </h1>
    </>
  );
};

export default MainBanner;
