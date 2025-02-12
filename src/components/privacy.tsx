"use client";
export default function Privacybtn() {
  const openbtn = () => {
    window.open(
      "https://docs.google.com/document/d/1CqFhNf0PGhyQl4KrE28IhRhUVjTBDHskdA6RjF5diS4/edit?tab=t.0",
      "_blank"
    );
  };
  return (
    <>
      <div className="fixed bottom-4 right-4 mr-4">
        <div>
          <button
            onClick={openbtn}
            className=" text-black text-xs"
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </>
  );
}
