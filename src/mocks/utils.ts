import { Hex, Address, getAddress, toHex, slice, keccak256 } from "viem";

export const calcMockTxHash = ({
  to,
  data,
  privateKey,
  nonce,
}: {
  to: Address;
  data: Hex;
  privateKey: Hex;
  nonce: bigint;
}) => {
  return toHex(
    keccak256(
      toHex(
        to.toString() +
          data.toString() +
          privateKey.toString() +
          nonce.toString()
      )
    )
  );
};

export const calcAddrFromPrivateKey = (privateKey: Hex): Address => {
  const hash = keccak256(privateKey);
  const trimmed = slice(hash, 0, 20);
  return getAddress(trimmed);
};

export const buildMockTxData = () => toHex("0x1234");
