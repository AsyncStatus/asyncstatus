import {
  LegalDocument,
  LegalHeading,
  LegalParagraph,
  LegalSmallHeading,
  LegalSubheading,
} from "@asyncstatus/ui/components/legal-text";

export default function Page() {
  return (
    <LegalDocument>
      <LegalHeading>AsyncStatus Cookie Policy</LegalHeading>
      <LegalParagraph>Effective Date: December 29, 2024</LegalParagraph>
      <LegalParagraph>
        We use cookies to help improve your experience of our website at{" "}
        <a href="https://asyncstatus.com">https://asyncstatus.com</a>. This
        cookie policy is part of AsyncStatus's privacy policy. It covers the use
        of cookies between your device and our site.
      </LegalParagraph>
      <LegalParagraph>
        We also provide basic information on third-party services we may use,
        who may also use cookies as part of their service. This policy does not
        cover their cookies.
      </LegalParagraph>
      <LegalParagraph>
        If you don’t wish to accept cookies from us, you should instruct your
        browser to refuse cookies from{" "}
        <a href="https://asyncstatus.com">https://asyncstatus.com</a>. In such a
        case, we may be unable to provide you with some of your desired content
        and services.
      </LegalParagraph>

      <LegalSubheading>What is a cookie?</LegalSubheading>
      <LegalParagraph>
        A cookie is a small piece of data that a website stores on your device
        when you visit. It typically contains information about the website
        itself, a unique identifier that allows the site to recognise your web
        browser when you return, additional data that serves the cookie’s
        purpose, and the lifespan of the cookie itself.
      </LegalParagraph>
      <LegalParagraph>
        Cookies are used to enable certain features (e.g. logging in), track
        site usage (e.g. analytics), store your user settings (e.g. time zone,
        notification preferences), and to personalize your content (e.g.
        advertising, language).
      </LegalParagraph>
      <LegalParagraph>
        Cookies set by the website you are visiting are usually referred to as
        first-party cookies. They typically only track your activity on that
        particular site.
      </LegalParagraph>
      <LegalParagraph>
        Cookies set by other sites and companies (i.e. third parties) are called
        third-party cookies. They can be used to track you on other websites
        that use the same third-party service.
      </LegalParagraph>

      <LegalSubheading>Types of cookies and how we use them</LegalSubheading>

      <LegalSmallHeading>Functionality cookies</LegalSmallHeading>
      <LegalParagraph>
        Functionality cookies are used to collect information about your device
        and any settings you may configure on the website you’re visiting (like
        language and time zone settings). With this information, websites can
        provide you with customized, enhanced, or optimized content and
        services. These cookies may be set by the website you’re visiting
        (first-party) or by third-party services.
      </LegalParagraph>
      <LegalParagraph>
        We use functionality cookies for selected features on our site.
      </LegalParagraph>

      <LegalSubheading>
        How Can You Control Our Website's Use of Cookies?
      </LegalSubheading>
      <LegalParagraph>
        You have the right to decide whether to accept or reject cookies on our
        Website. You can manage your cookie preferences in our Cookie Consent
        Manager. The Cookie Consent Manager allows you to select which
        categories of cookies you accept or reject. Essential cookies cannot be
        rejected as they are strictly necessary to provide you with the services
        on our Website.
      </LegalParagraph>
      <LegalParagraph>
        You may also be able to set or amend your cookie preferences by managing
        your web browser settings. As each web browser is different, please
        consult the instructions provided by your web browser (typically in the
        "help" section). If you choose to refuse or disable cookies you may
        still use the Website, though some of the functionality of the Website
        may not be available to you.
      </LegalParagraph>

      <LegalSubheading>
        How Often Will We Update This Cookie Policy?
      </LegalSubheading>
      <LegalParagraph>
        We may update this Cookie Policy from time to time in order to reflect
        any changes to the cookies and related technologies we use, or for other
        operational, legal or regulatory reasons.
      </LegalParagraph>
      <LegalParagraph>
        Each time you use our Website, the current version of the Cookie Policy
        will apply. When you use our Website, you should check the date of this
        Cookie Policy (which appears at the top of this document) and review any
        changes since the last version.
      </LegalParagraph>

      <LegalSubheading>
        Where Can You Obtain Further Information?
      </LegalSubheading>
      <LegalParagraph>
        For any questions or concerns regarding our Cookie Policy, you may
        contact us using the following details:
      </LegalParagraph>
      <LegalParagraph>
        Kacper Ochmański
        <br />
        kacper@asyncstatus.com
      </LegalParagraph>
    </LegalDocument>
  );
}
