import { useState } from "react";

import PageWrapper from "@/components/PageWrapper";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileToBase64 from "./components/FileToBase64";
import Base64ToFile from "./components/Base64ToFile";

type TabValue = "encode" | "decode";

const Homepage = () => {
  //! State
  const [tab, setTab] = useState<TabValue>("encode");
  const [handoffVersion, setHandoffVersion] = useState(0);

  //! Function
  // Chuyển kết quả sang tab kia mà không cần copy/dán chuỗi lớn
  const handleSendToDecoder = () => {
    setHandoffVersion((v) => v + 1);
    setTab("decode");
  };

  //! Render
  return (
    <PageWrapper>
      <div className="component:Homepage">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList className="mb-4">
            <TabsTrigger value="encode">Ảnh / Video → Base64</TabsTrigger>
            <TabsTrigger value="decode">Base64 → Ảnh / Video</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Cả hai luôn được mount (chỉ ẩn/hiện) để đổi tab không mất kết quả */}
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
