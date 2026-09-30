import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileToBase64 from "./components/FileToBase64";
import Base64ToFile from "./components/Base64ToFile";

const Homepage = () => {
  const [tab, setTab] = useState<"encode" | "decode">("encode");
  const [handoffVersion, setHandoffVersion] = useState(0);

  const handleSendToDecoder = () => {
    setHandoffVersion((v) => v + 1);
    setTab("decode");
  };

  return (
    <PageWrapper>
      <div className="component:Homepage">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "encode" | "decode")}>
          <TabsList className="mb-4">
            <TabsTrigger value="encode">Ảnh / Video → Base64</TabsTrigger>
            <TabsTrigger value="decode">Base64 → Ảnh / Video</TabsTrigger>
          </TabsList>
        </Tabs>

        <div hidden={tab !== "encode"}>
          <FileToBase64 onSendToDecoder={handleSendToDecoder} />
        </div>
        <div hidden={tab !== "decode"}>
          <Base64ToFile incomingVersion={handoffVersion} />
        </div>
      </div>
    </PageWrapper>
  );
};

export default Homepage;
