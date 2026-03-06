import type { ThemeId } from '../types';
import { getThemeCSS } from './themes';
import { getRuntimeJS } from './runtime';

export interface BaseOptions {
  title: string;
  theme: ThemeId;
  slidesHtml: string;
  audioFiles: string[];
  durations: number[];
}

export function generateHTML(opts: BaseOptions): string {
  const { title, theme, slidesHtml, audioFiles, durations } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — VIFM</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;600;700;800&family=Barlow+Condensed:wght@700;800&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>
:root{${getThemeCSS(theme)}}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--white);font-family:'Barlow',sans-serif;overflow:hidden;width:100vw;height:100vh;display:flex;flex-direction:column;}

/* ── Stage ── */
#stage{flex:1;position:relative;overflow:hidden;}
.slide{position:absolute;inset:0;display:none;overflow:hidden;}
.slide.active{display:block;}

/* ── Backgrounds ── */
.bg{position:absolute;inset:0;background:radial-gradient(ellipse at 30% 20%,var(--dark),var(--bg) 70%);}
.grid{position:absolute;inset:0;opacity:.35;background-image:
  linear-gradient(rgba(245,240,232,.04) 1px,transparent 1px),
  linear-gradient(90deg,rgba(245,240,232,.04) 1px,transparent 1px);
  background-size:60px 60px;}
.orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
.bline{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--blue),transparent);opacity:.18;}

/* ── Top Bar (breadcrumb + progress dots) ── */
.topbar{position:absolute;top:24px;left:40px;right:40px;display:flex;justify-content:space-between;align-items:center;z-index:10;}
.crumb{font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:rgba(245,240,232,.4);}
.crumb span{color:var(--blue);margin:0 4px;}
.prog{display:flex;gap:5px;}
.pd{width:18px;height:4px;border-radius:2px;background:rgba(245,240,232,.1);}
.pd.done{background:var(--blue);}
.pd.now{background:var(--blue2);box-shadow:0 0 8px var(--blue);}

/* ── Logo ── */
.logo{position:absolute;bottom:20px;right:32px;z-index:10;}
.lbox{background:var(--blue);color:var(--bg);font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:16px;padding:4px 10px;border-radius:4px;letter-spacing:.08em;box-shadow:0 0 22px color-mix(in srgb,var(--blue) 50%,transparent);}

/* ── Bottom Bar ── */
.bbar{position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--blue),color-mix(in srgb,var(--blue) 33%,transparent),var(--blue));box-shadow:0 0 14px color-mix(in srgb,var(--blue) 50%,transparent);}

/* ── Section Label ── */
.slabel{position:absolute;top:26px;right:40px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);opacity:.7;z-index:10;}

/* ── Controls Bar ── */
#controls{height:56px;background:rgba(0,0,0,.6);border-top:1px solid rgba(245,240,232,.08);display:flex;align-items:center;justify-content:center;gap:16px;padding:0 20px;flex-shrink:0;}
#controls button{background:none;border:1px solid rgba(245,240,232,.2);color:var(--white);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
#controls button:hover:not(:disabled){border-color:var(--blue);color:var(--blue);}
#controls button:disabled{opacity:.3;cursor:not-allowed;}
#ctrl-counter{font-size:14px;color:rgba(245,240,232,.5);min-width:60px;text-align:center;letter-spacing:.08em;}
#progress{position:absolute;top:0;left:0;right:0;height:3px;background:rgba(245,240,232,.06);}
#prog-fill{height:100%;background:var(--blue);transition:width .4s ease;width:0;box-shadow:0 0 8px var(--blue);}

/* ── Lucide Icon Sizing ── */
.icon-sm{width:18px;height:18px;flex-shrink:0;color:var(--blue);}
.icon-md{width:24px;height:24px;flex-shrink:0;color:var(--blue);}
.icon-lg{width:32px;height:32px;flex-shrink:0;color:var(--blue);}
.icon-xl{width:48px;height:48px;flex-shrink:0;color:var(--blue);}
.icon-emoji{display:inline-flex;align-items:center;justify-content:center;}

/* ── Animations ── */
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fsu{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fsd{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fsl{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
@keyframes fsr{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
@keyframes grow{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes glow{0%,100%{box-shadow:0 0 8px var(--blue)}50%{box-shadow:0 0 24px var(--blue2)}}
@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}

/* ── Common Content Classes ── */
.acc{color:var(--blue);}

/* ── Shared: Title header (top-left) for stacked layouts ── */
.s1label{font-size:14px;letter-spacing:.25em;text-transform:uppercase;color:var(--blue);}
.s1title{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:40px;line-height:1.05;text-transform:uppercase;}

/* ================================================================
   STACKED LAYOUTS — Title at top, content full-width below
   ================================================================ */

/* Style 1: Key Points */
.s1content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.s1left{flex:none;display:flex;flex-direction:column;gap:4px;}
.s1right{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:14px;align-content:start;overflow-y:auto;}
.s1card{display:flex;align-items:flex-start;gap:16px;background:var(--card);border:1px solid rgba(245,240,232,.06);border-radius:10px;padding:20px 22px;}
.s1icon{font-size:30px;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;}
.s1ctitle{font-weight:700;font-size:22px;margin-bottom:4px;}
.s1cdesc{font-size:20px;color:rgba(245,240,232,.6);line-height:1.5;font-weight:300;}

/* Style 2: Timeline */
.s2content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.s2left{flex:none;display:flex;flex-direction:column;gap:4px;}
.s2right{flex:1;position:relative;display:flex;flex-direction:column;gap:0;overflow-y:auto;}
.s2line{position:absolute;left:14px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,var(--blue),transparent);}
.s2item{display:flex;align-items:flex-start;gap:16px;padding:12px 0;position:relative;}
.s2dot{width:10px;height:10px;border-radius:50%;background:var(--blue);flex-shrink:0;margin-top:5px;box-shadow:0 0 10px var(--blue);position:relative;z-index:1;}
.s2year{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:24px;color:var(--blue);min-width:50px;}
.s2text{flex:1;}
.s2ttitle{font-weight:600;font-size:22px;margin-bottom:3px;}
.s2tdesc{font-size:19px;color:rgba(245,240,232,.55);line-height:1.5;font-weight:300;}

/* Style 3: Comparison */
.s3content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.s3left{flex:none;display:flex;flex-direction:column;gap:4px;}
.s3right{flex:1;display:flex;flex-direction:column;gap:8px;overflow-y:auto;}
.s3header{display:grid;grid-template-columns:180px 1fr 1fr;gap:10px;font-size:16px;letter-spacing:.15em;text-transform:uppercase;color:var(--blue);padding:0 14px;}
.s3row{display:grid;grid-template-columns:180px 1fr 1fr;gap:10px;background:var(--card);border-radius:8px;padding:16px;border:1px solid rgba(245,240,232,.05);}
.s3aspect{font-weight:600;font-size:20px;color:var(--blue2);}
.s3cell{font-size:20px;color:rgba(245,240,232,.7);line-height:1.5;font-weight:300;}
.s3verdict{margin-top:10px;font-size:20px;color:var(--blue);padding:12px 18px;background:rgba(245,240,232,.03);border-radius:8px;border-left:3px solid var(--blue);}

/* Style 4: KPI Stats */
.s4content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.s4left{flex:none;display:flex;flex-direction:column;gap:4px;}
.s4right{flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;align-content:start;}
.s4stat{background:var(--card);border:1px solid rgba(245,240,232,.06);border-radius:12px;padding:28px 24px;text-align:center;}
.s4val{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:64px;color:var(--blue);line-height:1;}
.s4lbl{font-size:20px;color:rgba(245,240,232,.6);margin-top:10px;font-weight:300;}
.s4src{font-size:13px;color:rgba(245,240,232,.3);margin-top:6px;font-style:italic;}

/* Style 5: Icon Grid */
.s5content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.s5left{flex:none;display:flex;flex-direction:column;gap:4px;}
.s5right{flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;align-content:start;}
.s5item{background:var(--card);border:1px solid rgba(245,240,232,.06);border-radius:10px;padding:22px 20px;text-align:center;}
.s5icon{font-size:36px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;}
.s5ititle{font-weight:700;font-size:21px;margin-bottom:5px;}
.s5idesc{font-size:19px;color:rgba(245,240,232,.55);line-height:1.5;font-weight:300;}

/* Style 6: Quote (centered — no change) */
.s6content{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
.s6inner{max-width:800px;text-align:center;padding:40px;}
.s6mark{font-size:72px;color:var(--blue);opacity:.4;line-height:1;margin-bottom:16px;}
.s6text{font-size:36px;font-weight:300;line-height:1.6;color:rgba(245,240,232,.9);font-style:italic;}
.s6attr{margin-top:24px;font-size:21px;color:var(--blue);font-weight:600;}
.s6role{font-size:18px;color:rgba(245,240,232,.4);margin-top:4px;}

/* Style 7: Case Study */
.s7label{position:absolute;top:24px;left:40px;font-size:14px;letter-spacing:.2em;text-transform:uppercase;color:var(--blue);z-index:10;}
.s7content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.s7left{flex:none;display:flex;flex-direction:column;gap:8px;}
.s7title{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:36px;line-height:1.1;text-transform:uppercase;}
.s7ctx,.s7chal{background:var(--card);border-radius:10px;padding:16px 18px;border:1px solid rgba(245,240,232,.05);}
.s7ctxlabel,.s7challabel{font-size:15px;letter-spacing:.15em;text-transform:uppercase;color:var(--blue);margin-bottom:5px;}
.s7ctxtxt,.s7chaltxt{font-size:20px;color:rgba(245,240,232,.7);line-height:1.5;font-weight:300;}
.s7right{flex:1;display:flex;flex-direction:column;gap:10px;}
.s7restitle{font-size:14px;letter-spacing:.15em;text-transform:uppercase;color:var(--blue);margin-bottom:2px;}
.s7result{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;flex:1;}
.s7ri{background:var(--card);border-radius:10px;padding:14px 16px;border:1px solid rgba(245,240,232,.05);}
.s7rval{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:44px;color:var(--blue2);}
.s7rtxt{font-size:19px;color:rgba(245,240,232,.6);line-height:1.5;font-weight:300;margin-top:3px;}
.s7source{font-size:13px;color:rgba(245,240,232,.3);font-style:italic;margin-top:auto;padding-top:6px;}

/* Style 8: Deep Dive */
.s8content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.s8left{flex:none;display:flex;flex-direction:column;gap:4px;}
.s8right{flex:1;display:flex;flex-direction:column;gap:12px;overflow-y:auto;}
.s8section{background:var(--card);border-radius:10px;padding:18px 20px;border:1px solid rgba(245,240,232,.05);}
.s8stitle{font-weight:700;font-size:22px;color:var(--blue);margin-bottom:7px;}
.s8stext{font-size:20px;color:rgba(245,240,232,.65);line-height:1.6;font-weight:300;}

/* Text A: Big Statement (centered — no change) */
.sAcontent{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:60px;}
.sAlabel{font-size:14px;letter-spacing:.3em;text-transform:uppercase;color:var(--blue);margin-bottom:20px;}
.sAtext{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:74px;line-height:1.05;text-transform:uppercase;max-width:900px;}
.sAsub{font-size:24px;color:rgba(245,240,232,.5);margin-top:20px;font-weight:300;max-width:700px;margin-left:auto;margin-right:auto;}

/* Text B: Numbered List */
.sBcontent{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.sBleft{flex:none;display:flex;flex-direction:column;gap:4px;}
.sBright{flex:1;display:flex;flex-direction:column;gap:10px;overflow-y:auto;}
.sBitem{display:flex;align-items:flex-start;gap:14px;padding:10px 0;border-bottom:1px solid rgba(245,240,232,.05);}
.sBnum{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:44px;color:var(--blue);min-width:42px;}
.sBtext{font-size:22px;font-weight:600;margin-bottom:3px;}
.sBdetail{font-size:19px;color:rgba(245,240,232,.5);line-height:1.5;font-weight:300;}

/* Text C: Two-Column */
.sCcontent{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.sCleft-info{flex:none;display:flex;flex-direction:column;gap:4px;}
.sCcols{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:20px;align-content:start;overflow-y:auto;}
.sCcol{display:flex;flex-direction:column;gap:8px;}
.sCcoltitle{font-size:17px;letter-spacing:.15em;text-transform:uppercase;color:var(--blue);margin-bottom:6px;font-weight:600;}
.sCitem{font-size:20px;color:rgba(245,240,232,.7);line-height:1.5;padding:12px 16px;background:var(--card);border-radius:6px;border:1px solid rgba(245,240,232,.04);}

/* Text D: Term Cards */
.sDcontent{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.sDleft{flex:none;display:flex;flex-direction:column;gap:4px;}
.sDright{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:12px;align-content:start;overflow-y:auto;}
.sDcard{background:var(--card);border:1px solid rgba(245,240,232,.06);border-radius:10px;padding:18px 20px;border-left:3px solid var(--blue);}
.sDterm{font-weight:700;font-size:22px;color:var(--blue2);margin-bottom:5px;}
.sDdef{font-size:20px;color:rgba(245,240,232,.6);line-height:1.5;font-weight:300;}

/* Text E: Do / Don't */
.sEcontent{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.sEleft{flex:none;display:flex;flex-direction:column;gap:4px;}
.sEcols{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:16px;align-content:start;overflow-y:auto;}
.sEcol{display:flex;flex-direction:column;gap:8px;}
.sEheader{font-size:17px;letter-spacing:.15em;text-transform:uppercase;font-weight:700;padding:10px 14px;border-radius:8px;text-align:center;}
.sEdo-header{color:#4ade80;background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.2);}
.sEdont-header{color:#f87171;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);}
.sEitem{font-size:20px;color:rgba(245,240,232,.7);padding:12px 16px;background:var(--card);border-radius:6px;border:1px solid rgba(245,240,232,.04);display:flex;align-items:center;gap:10px;}
.sEitem-do::before{content:'\\2713';color:#4ade80;font-weight:700;}
.sEitem-dont::before{content:'\\2717';color:#f87171;font-weight:700;}

/* Text F: Recap */
.sFcontent{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.sFleft{flex:none;display:flex;flex-direction:column;gap:4px;}
.sFright{flex:1;display:flex;flex-direction:column;gap:10px;overflow-y:auto;}
.sFpoint{display:flex;align-items:center;gap:16px;padding:16px 20px;background:var(--card);border-radius:8px;border:1px solid rgba(245,240,232,.05);}
.sFicon{font-size:26px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.sFtext{font-size:21px;color:rgba(245,240,232,.75);line-height:1.5;}

/* Text G: Step Detail */
.sGcontent{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.sGleft{flex:none;display:flex;flex-direction:column;gap:4px;}
.sGright{flex:1;display:flex;flex-direction:column;gap:14px;overflow-y:auto;}
.sGstep-num{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:74px;color:var(--blue);opacity:.3;line-height:1;}
.sGstep-title{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:40px;text-transform:uppercase;}
.sGdesc{font-size:21px;color:rgba(245,240,232,.65);line-height:1.7;font-weight:300;}
.sGsubs{display:flex;flex-direction:column;gap:8px;margin-top:6px;}
.sGsub{font-size:20px;color:rgba(245,240,232,.6);padding:10px 16px;background:var(--card);border-radius:6px;border-left:2px solid var(--blue);display:flex;align-items:center;gap:10px;}

/* Text H: Q&A (centered — no change) */
.sHcontent{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
.sHinner{max-width:800px;width:100%;padding:60px 40px;}
.sHq{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:50px;text-transform:uppercase;margin-bottom:28px;line-height:1.15;}
.sHa{font-size:24px;color:rgba(245,240,232,.7);line-height:1.8;font-weight:300;border-left:3px solid var(--blue);padding-left:24px;}

/* Diagram 9: Vertical Timeline */
.d9content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.d9left{flex:none;display:flex;flex-direction:column;gap:4px;}
.d9right{flex:1;position:relative;padding-left:30px;overflow-y:auto;}
.d9line{position:absolute;left:14px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,var(--blue),rgba(245,240,232,.08));}
.d9item{position:relative;padding:12px 0 12px 24px;border-bottom:1px solid rgba(245,240,232,.04);}
.d9dot{position:absolute;left:-23px;top:16px;width:10px;height:10px;border-radius:50%;background:var(--blue);box-shadow:0 0 10px var(--blue);}
.d9label{font-size:16px;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);font-weight:600;margin-bottom:4px;}
.d9title{font-weight:600;font-size:21px;margin-bottom:3px;}
.d9desc{font-size:19px;color:rgba(245,240,232,.5);line-height:1.5;font-weight:300;}

/* Diagram 10: Roadmap (already stacked) */
.d10content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;flex-direction:column;gap:28px;}
.d10title-area{display:flex;flex-direction:column;gap:4px;}
.d10phases{flex:1;display:flex;gap:12px;align-items:stretch;}
.d10phase{flex:1;background:var(--card);border:1px solid rgba(245,240,232,.06);border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:8px;}
.d10plabel{font-size:16px;letter-spacing:.15em;text-transform:uppercase;color:var(--blue);font-weight:600;}
.d10ptitle{font-weight:700;font-size:22px;margin-bottom:5px;}
.d10pitem{font-size:19px;color:rgba(245,240,232,.6);padding:5px 0;border-bottom:1px solid rgba(245,240,232,.03);}

/* ================================================================
   SIDE-BY-SIDE LAYOUTS — SVG diagrams keep left title + right visual
   ================================================================ */

/* Diagram 11: Circular Process */
.d11content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;gap:40px;align-items:center;}
.d11left{flex:1;display:flex;flex-direction:column;gap:12px;}
.d11right{flex:0 0 420px;height:420px;position:relative;}

/* Diagram 12: Funnel */
.d12content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;gap:40px;align-items:center;}
.d12left{flex:1;display:flex;flex-direction:column;gap:12px;}
.d12right{flex:0 0 400px;display:flex;flex-direction:column;align-items:center;gap:4px;}
.d12stage{display:flex;align-items:center;justify-content:center;text-align:center;border-radius:8px;padding:14px;color:var(--white);font-size:19px;font-weight:600;transition:all .3s;}

/* Diagram 13: Pyramid */
.d13content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;gap:40px;align-items:center;}
.d13left{flex:1;display:flex;flex-direction:column;gap:12px;}
.d13right{flex:0 0 420px;display:flex;flex-direction:column;align-items:center;gap:4px;}
.d13level{display:flex;align-items:center;justify-content:center;text-align:center;padding:12px;font-size:19px;font-weight:600;border-radius:6px;border:1px solid rgba(245,240,232,.08);}

/* Diagram 14: Flowchart */
.d14content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;gap:32px;align-items:flex-start;}
.d14left{flex:0 0 280px;display:flex;flex-direction:column;gap:12px;}
.d14right{flex:1;position:relative;overflow-y:auto;max-height:100%;}
.d14node{background:var(--card);border:1px solid rgba(245,240,232,.08);border-radius:8px;padding:12px 18px;font-size:19px;text-align:center;position:absolute;}
.d14node-start,.d14node-end{border-radius:20px;background:var(--blue);color:var(--bg);font-weight:700;}
.d14node-decision{transform:rotate(0deg);border-color:var(--blue);background:rgba(245,240,232,.04);}

/* Diagram 15: Hub & Spoke */
.d15content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;gap:40px;align-items:center;}
.d15left{flex:1;display:flex;flex-direction:column;gap:12px;}
.d15right{flex:0 0 480px;height:480px;position:relative;}

/* Diagram 16: 2x2 Matrix */
.d16content{position:absolute;top:60px;left:40px;right:40px;bottom:36px;display:flex;gap:40px;align-items:center;}
.d16left{flex:1;display:flex;flex-direction:column;gap:12px;}
.d16right{flex:0 0 500px;position:relative;display:flex;flex-direction:column;gap:6px;}
.d16grid{flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:6px;}
.d16cell{border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:6px;border:1px solid rgba(245,240,232,.08);background:var(--card);overflow:hidden;}
.d16cell-highlight{border:2px solid color-mix(in srgb,var(--blue) 50%,transparent);background:color-mix(in srgb,var(--blue) 12%,transparent);box-shadow:0 0 24px color-mix(in srgb,var(--blue) 15%,transparent);}
.d16clabel{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);font-weight:600;}
.d16items{display:flex;flex-direction:column;gap:3px;}
.d16item{font-size:14px;color:rgba(245,240,232,.7);background:color-mix(in srgb,var(--blue) 10%,transparent);border-radius:6px;padding:4px 8px;line-height:1.35;}
.d16axes{display:flex;justify-content:space-between;padding:0 4px;}
.d16axis{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--gray);white-space:nowrap;}

/* ── Matrix Legend ── */
.mxlegend{display:flex;align-items:flex-start;gap:10px;padding:8px 12px;border-radius:8px;border:1px solid rgba(245,240,232,.06);background:rgba(245,240,232,.02);}
.mxldot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:3px;background:var(--gray);}
.mxltitle{font-size:19px;font-weight:600;}
.mxlsub{font-size:17px;color:rgba(245,240,232,.5);font-weight:300;margin-top:2px;}

/* ── Responsive ── */
@media(max-width:768px){
  .s1content,.s2content,.s3content,.s4content,.s5content,.s6content,
  .s7content,.s8content,.sBcontent,.sCcontent,.sDcontent,.sEcontent,
  .sFcontent,.sGcontent,.d9content,.d10content,.d11content,.d12content,
  .d13content,.d14content,.d15content,.d16content{
    flex-direction:column;gap:12px;overflow-y:auto;padding-bottom:16px;
  }
  .s1right,.s2right,.s3right,.s4right,.s5right,.s7right,.s8right,
  .sBright,.sCcols,.sDright,.sEcols,.sFright,.sGright,
  .d9right,.d10phases,.d11right,.d12right,.d13right,.d14right,.d15right,.d16right{
    flex:none;width:100%;max-width:100%;
  }
  .s1right,.s4right,.s5right,.sDright{grid-template-columns:1fr;}
  .s1title,.s7title,.sAtext{font-size:28px;}
  .topbar{left:16px;right:16px;top:12px;}
  .s1content,.s2content,.s3content,.s4content,.s5content,
  .s7content,.s8content,.sBcontent,.sCcontent,.sDcontent,.sEcontent,
  .sFcontent,.sGcontent,.d9content,.d10content,.d11content,
  .d12content,.d13content,.d14content,.d15content,.d16content{
    top:48px;left:16px;right:16px;bottom:8px;
  }
}
</style>
</head>
<body>
<div id="progress"><div id="prog-fill"></div></div>
<div id="stage">
${slidesHtml}
</div>
<div id="controls">
  <button id="ctrl-prev" title="Previous">◀</button>
  <button id="ctrl-play" title="Play">▶</button>
  <span id="ctrl-counter">1 / 1</span>
  <button id="ctrl-next" title="Next">▶</button>
</div>
${getRuntimeJS(audioFiles, durations)}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
