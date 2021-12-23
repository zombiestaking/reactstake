import React, { useEffect } from "react";

function Page(props) {

  useEffect(() => {
    document.title = "Stake calc | " + props.title;
  }, [props.title]);

  return (
    <div className="Page">
      {props.children}
    </div>
  );
}

export default Page