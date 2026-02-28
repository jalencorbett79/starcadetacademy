import book from "/book.svg";

import React from "react";
import css from "./Osdk.module.css";

function Osdk(): React.ReactElement {
  return (
    <div className={css.osdk}>
      <div>
        <span>OSDK: </span>
        <span className={css.tag}>@space-program-application/sdk</span>
      </div>
      <a
        href="https://buildthefuture.usw-22.palantirfoundry.com/workspace/developer-console/app/ri.third-party-applications.main.application.ca72cd5c-cd3d-4d2a-877d-9de3c0c1d199/docs/guide/loading-data?language=typescript"
        className={css.docs}
        target="_blank"
        rel="noreferrer"
      >
        <img src={book} width={16} height={16} alt="Book icon"></img>
        <span>View documentation</span>
      </a>
    </div>
  );
}

export default Osdk;
