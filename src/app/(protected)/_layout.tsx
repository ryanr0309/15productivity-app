import { Slot, Redirect } from "expo-router";
import React, { useEffect, useState } from "react";



export default function ProtectedLayout() {


  return (
      <>
      <Slot />
    </>
  );
}
