import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
} from "@react-email/components";

export function Layout({
  children,
  preview,
}: {
  children: React.ReactNode;
  preview?: string;
}) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="ABCFavorit"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://pub-5936183d49924fb4af2d9dbf9637510c.r2.dev/ABCFavorit-Bold.woff2",
            format: "woff2",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
        <Font
          fontFamily="ABCFavorit"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://pub-5936183d49924fb4af2d9dbf9637510c.r2.dev/ABCFavorit-Medium.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>

      <Body
        style={{
          gap: 0,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 64,
          paddingBottom: 64,
        }}
      >
        {preview && <Preview>{preview}</Preview>}

        <Container
          style={{
            width: "680px",
            maxWidth: "100%",
            margin: "0 auto",
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}
