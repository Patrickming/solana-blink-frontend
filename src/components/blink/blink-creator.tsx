"use client"

import { useState } from "react"
import type { z } from "zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BlinkForm } from "@/components/forms/blink-form"
import { BlinkPreview } from "@/components/blink/blink-preview-card"
import { TokenForm } from "@/components/forms/token-form"
import { NftForm } from "@/components/forms/nft-form"
import type { blinkFormSchema } from "@/lib/validators"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/context/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * Blink创建器组件
 * 包含Blink、代币和NFT创建功能的主界面
 *
 * @returns Blink创建器组件
 */
export default function BlinkCreator() {
  // 状态管理
  const [activeTab, setActiveTab] = useState("blink") // 当前活动标签页
  const [formValues, setFormValues] = useState<z.infer<typeof blinkFormSchema>>({
    // 初始表单值
    type: "tipping", // 修改默认类型为捐赠(原打赏)
    tokenSwap: {
      fromToken: "",
      toToken: "",
      amount: "",
      slippage: 0.5,
      deadline: 10,
      autoExecute: true,
    },
    buyNft: {
      collectionAddress: "",
      nftId: "",
      price: "",
      currency: "SOL",
      expiryDate: "",
      message: "",
    },
    staking: {
      token: "",
      amount: "",
      period: 30,
      expectedYield: "",
      poolAddress: "",
      autoCompound: false,
    },
    custom: {
      name: "",
      description: "",
      instructions: "",
      parameters: "",
      requiresApproval: true,
    },
    tipping: {
      recipientAddress: "",
      token: "SOL",
      suggestedAmounts: ["5", "10", "20"],
      customAmount: true,
      message: "",
      baseAmount: "0.01",
      imageUrl: "https://cryptologos.cc/logos/solana-sol-logo.png",
      title: "捐赠 SOL",
      description: "通过此Blink向指定地址捐赠SOL代币",
      allowAnonymous: false,
      showLeaderboard: false,
    },
  })

  const { toast } = useToast()
  const { t } = useLanguage()

  // 用于重置表单的状态
  const [formKey, setFormKey] = useState(0)

  // 表单实例
  const tokenForm = useForm()
  const nftForm = useForm()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  // 获取当前选择的Blink类型
  const blinkType = formValues.type

  // 处理Blink类型变更
  const handleBlinkTypeChange = (type: string) => {
    // 设置默认值
    const typeValue = type as z.infer<typeof blinkFormSchema>["type"];
    
    // 创建一个新的表单值对象，保留先前所有部分，但更新type
    setFormValues((prev) => {
      // 保留所有现有表单数据，但更新类型
      return {
        ...prev,
        type: typeValue
      };
    });
    
    // 重置表单 - 通过更改key来强制重新创建表单组件
    setFormKey(prevKey => prevKey + 1);
  };

  /**
   * 处理表单变化
   * 更新formValues状态，使预览组件能够实时反映表单变化
   *
   * @param values - 表单值
   */
  const handleFormChange = (values: any) => {
    setFormValues((prev) => ({
      ...prev,
      ...values,
    }))
  }

  /**
   * 处理Blink表单提交
   * 更新表单值并显示成功提示
   *
   * @param values - 表单值
   */
  const handleBlinkSubmit = (values: z.infer<typeof blinkFormSchema>) => {
    setFormValues(values)
    
    // 如果是捐赠SOL类型的Blink，构建donate-sol API的URL
    if (values.type === "tipping" && values.tipping.token === "SOL" && values.tipping.recipientAddress) {
      // 构建API URL用于后续请求
      const apiUrl = new URL("/api/actions/donate-sol", window.location.origin);
      apiUrl.searchParams.append("recipient", values.tipping.recipientAddress);
      apiUrl.searchParams.append("baseAmount", values.tipping.baseAmount || "0.01");
      
      if (values.tipping.imageUrl) {
        apiUrl.searchParams.append("imageUrl", values.tipping.imageUrl);
      }
      
      if (values.tipping.title) {
        apiUrl.searchParams.append("title", values.tipping.title);
      }
      
      if (values.tipping.description) {
        apiUrl.searchParams.append("description", values.tipping.description);
      }
      
      // 生成可分享的链接
      const shareableUrl = new URL("/blink", window.location.origin);
      shareableUrl.searchParams.append("action", apiUrl.toString());
      
      // 记录生成的API URL和可分享的链接
      console.log("捐赠SOL API URL:", apiUrl.toString());
      console.log("可分享链接:", shareableUrl.toString());
    }
    
    toast({
      title: t("blink.success"),
      description: t("blink.successDescription"),
    })
  }

  /**
   * 处理代币表单提交
   * 显示成功提示
   *
   * @param values - 表单值
   */
  const handleTokenSubmit = (values: any) => {
    toast({
      title: t("token.success"),
      description: t("token.successDescription"),
    })
  }

  /**
   * 处理NFT表单提交
   * 显示成功提示
   *
   * @param values - 表单值
   */
  const handleNftSubmit = (values: any) => {
    toast({
      title: t("nft.success"),
      description: t("nft.successDescription"),
    })
  }

  return (
    <div className="container py-8">
      <Tabs defaultValue="blink" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="blink">{t("blink.tabs.blink")}</TabsTrigger>
          <TabsTrigger value="token">{t("blink.tabs.token")}</TabsTrigger>
          <TabsTrigger value="nft">{t("blink.tabs.nft")}</TabsTrigger>
        </TabsList>

        {/* Blink 创建内容 */}
        <TabsContent value="blink">
          {/* Blink类型选择 - 移到表单上方 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t("blink.form.type")}</CardTitle>
              <CardDescription>{t("blink.form.typeDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Select onValueChange={handleBlinkTypeChange} value={blinkType}>
                <SelectTrigger>
                  <SelectValue placeholder={t("blink.form.typeSelect")} />
                </SelectTrigger>
                <SelectContent>
                  {/* 只保留捐赠和质押选项 */}
                  <SelectItem value="staking">{t("blink.form.typeStaking")}</SelectItem>
                  <SelectItem value="tipping">捐赠</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              {/* 使用key来重新渲染组件，当类型变更时 */}
              <div key={formKey}>
                <BlinkForm 
                  onSubmit={handleBlinkSubmit} 
                  onChange={handleFormChange} 
                />
              </div>
            </div>
            <div className="space-y-8">
              <BlinkPreview formValues={formValues} />
            </div>
          </div>
        </TabsContent>

        {/* 代币创建内容 */}
        <TabsContent value="token">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <TokenForm onSubmit={handleTokenSubmit} form={tokenForm} />
            </div>
            <div className="space-y-8">
              {/* 代币预览组件 */}
              <Card>
                <CardHeader>
                  <CardTitle>代币预览</CardTitle>
                  <CardDescription>您的代币将如下所示</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-bold">{tokenForm?.getValues("symbol")?.slice(0, 2) || "?"}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{tokenForm?.getValues("name") || "代币名称"}</h3>
                        <p className="text-sm text-muted-foreground">{tokenForm?.getValues("symbol") || "符号"}</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">总供应量</p>
                          <p className="font-medium">
                            {tokenForm?.getValues("totalSupply")
                              ? Number(tokenForm.getValues("totalSupply")).toLocaleString()
                              : "0"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">小数位数</p>
                          <p className="font-medium">{tokenForm?.getValues("decimals") || 9}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">代币类型</p>
                          <p className="font-medium">
                            {tokenForm?.getValues("tokenType") === "standard"
                              ? "标准代币"
                              : tokenForm?.getValues("tokenType") === "mintable"
                                ? "可增发代币"
                                : "可销毁代币"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">转账费率</p>
                          <p className="font-medium">{tokenForm?.getValues("transferFee") || 0}%</p>
                        </div>
                      </div>

                      {tokenForm?.getValues("metadata.description") && (
                        <div>
                          <p className="text-sm text-muted-foreground">描述</p>
                          <p className="text-sm">{tokenForm.getValues("metadata.description")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* NFT 创建内容 */}
        <TabsContent value="nft">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <NftForm onSubmit={handleNftSubmit} form={nftForm} setSelectedImage={setSelectedImage} />
            </div>
            <div className="space-y-8">
              {/* NFT预览组件 */}
              <Card>
                <CardHeader>
                  <CardTitle>NFT预览</CardTitle>
                  <CardDescription>您的NFT将如下所示</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border p-6">
                    <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
                      {selectedImage ? (
                        <img
                          src={URL.createObjectURL(selectedImage) || "/placeholder.svg"}
                          alt="NFT Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-muted-foreground">NFT 图片预览</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <h3 className="text-xl font-bold">{nftForm?.getValues("name") || "NFT 名称"}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {nftForm?.getValues("description") || "NFT 描述将显示在这里"}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">版税</p>
                        <p className="font-medium">{nftForm?.getValues("royalty") || 5}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">创作者份额</p>
                        <p className="font-medium">{nftForm?.getValues("creatorShare") || 100}%</p>
                      </div>
                      {nftForm?.getValues("maxSupply") && (
                        <div>
                          <p className="text-sm text-muted-foreground">最大供应量</p>
                          <p className="font-medium">{nftForm.getValues("maxSupply")}</p>
                        </div>
                      )}
                      {nftForm?.getValues("symbol") && (
                        <div>
                          <p className="text-sm text-muted-foreground">符号</p>
                          <p className="font-medium">{nftForm.getValues("symbol")}</p>
                        </div>
                      )}
                    </div>

                    {nftForm?.getValues("attributes") && (
                      <div className="mt-4">
                        <p className="text-sm font-medium">属性</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {(() => {
                            try {
                              const attributes = JSON.parse(nftForm.getValues("attributes"))
                              return attributes.map((attr: any, index: number) => (
                                <div key={index} className="rounded-md bg-muted p-2">
                                  <p className="text-xs text-muted-foreground">{attr.trait_type}</p>
                                  <p className="text-sm font-medium">{attr.value}</p>
                                </div>
                              ))
                            } catch (e) {
                              return (
                                <div className="rounded-md bg-muted p-2">
                                  <p className="text-xs text-red-500">JSON 格式错误</p>
                                </div>
                              )
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

