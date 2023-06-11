import axios from "axios";
import { useEffect, useState } from "react";
import {
  View,
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
} from "react-native";
import { NumberProp, SvgXml } from "react-native-svg";

type Props = {
  width?: NumberProp;
  height?: NumberProp;
  uri: string | null;
  style?: StyleProp<ImageStyle>;
  defaultSource?: ImageSourcePropType;
};

export default function SvgImageUri({
  width,
  height,
  uri,
  style,
  defaultSource,
}: Props) {
  const [imageXml, setImageXml] = useState("");
  useEffect(() => {
    const go = async () => {
      if (!uri) return;
      const { data } = await axios.get(uri);
      setImageXml(data);
    };
    go();
  }, [uri]);
  if (!imageXml) {
    if (defaultSource) {
      return <Image source={defaultSource} style={style} />;
    } else {
      return null;
    }
  }
  return (
    <View style={[style, { overflow: "hidden" }]}>
      <SvgXml width={width} height={height} xml={imageXml} />
    </View>
  );
}
