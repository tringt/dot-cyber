import React from 'react';
import { Pane, Text } from '@cybercongress/gravity';
import { Link } from 'react-router-dom';

const Battery = () => {
  return (
    <main className="block-body">
      <Pane
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        display="flex"
        paddingY="20px"
        paddingX="20%"
        textAlign="justify"
      >
        <Text lineHeight="23px" marginBottom={20} color="#fff" fontSize="18px">
          To compute the knowledge supercomputer Cyber requires power and
          energy. Power needed to compute better, energy needed to compute more.
          That is why cyberlinking requires power and energy. Power defines how
          much your cyberlink impacts the rank. Energy defines how much
          cyberlinks you can submit. The more CYB you have (or EUL during Game
          of Links), the more power and energy you got.
        </Text>
        <Text lineHeight="23px" marginBottom={20} color="#fff" fontSize="18px">
          Amount of energy needed to spend on 1 cyberlink depends on current
          load of supercomputer. If Cyber is fully loaded price of 1 cyberlink
          is 400 watts. Currently Cyber is 1% loaded so the the price is 4
          watts. Cyb is autonomous robot so is able fully recharge you Cyber
          energy in 24 hours.
        </Text>

        <Text lineHeight="23px" marginBottom={20} color="#fff" fontSize="18px">
          if not connected: You need to get EUL in order to submit cyberlinks
        </Text>
        <Text lineHeight="23px" color="#fff" fontSize="18px">
          if connected: 17 GEUL gives you 0.0012 ‱ of cyber power, or equivalent
          energy capacity of 15 kW. So you can do 3750 cyberlinks a day. But you
          have left 6 kW and can immediately submit 1500 cyberlinks.
        </Text>
      </Pane>
    </main>
  );
};

export default Battery;
